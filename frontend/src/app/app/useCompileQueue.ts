'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

import type {
  TemplateKey, HeadingVariant, PageSize, MarginPreset,
  CompileMode, CustomFont, Status, CompileError, Stage, Platform,
  CompileQuality, Asset,
} from './editor-types'
import { adjustHeadingsForTemplate, buildFilename, abortableDelay } from './editor-utils'
import { createClient, isPocketBaseConfigured } from '@/lib/supabase'
import { debugLog } from './debug-log'

/* ═══════════════════════════════════════════════════════════════════
   useCompileQueue — Centralized compile + debounce hook
   Encapsulates the compile function, debounce timers, abort handling,
   polling, and PDF blob management.
   ═══════════════════════════════════════════════════════════════════ */

export interface CompileQueueOptions {
  manuscript: string
  template: TemplateKey
  headingVariant: HeadingVariant
  title: string
  pageSize: PageSize
  marginPreset: MarginPreset
  safeMode: boolean
  compileMode: CompileMode
  customFont: CustomFont
  assets: Asset[]
  stage: Stage
  refreshUser: () => void
}

export function useCompileQueue({
  manuscript, template, headingVariant, title, pageSize, marginPreset,
  safeMode, compileMode, customFont, assets, stage, refreshUser,
}: CompileQueueOptions) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<CompileError[]>([])
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [lastDownloadWatermarked, setLastDownloadWatermarked] = useState(false)
  const [quality, setQuality] = useState<CompileQuality>(null)
  const pdfBlobRef = useRef<Blob | null>(null)

  const debounceRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const compileGenRef = useRef(0)
  const retryCountRef = useRef(0)

  // Clean blob URLs on unmount/swap
  useEffect(() => {
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl) }
  }, [pdfUrl])

  // ── Immediate status feedback on settings change ──
  // Show "compiling" immediately when any design parameter changes so the user
  // sees visual feedback that a new compile is coming (before the debounce fires).
  const prevTemplateRef = useRef(template)
  const prevVariantRef = useRef(headingVariant)
  const prevPageSizeRef = useRef(pageSize)
  const prevMarginRef = useRef(marginPreset)
  const prevSafeModeRef = useRef(safeMode)
  const prevCompileModeRef = useRef(compileMode)
  useEffect(() => {
    if (stage !== 'design') return
    const changed =
      prevTemplateRef.current !== template ||
      prevVariantRef.current !== headingVariant ||
      prevPageSizeRef.current !== pageSize ||
      prevMarginRef.current !== marginPreset ||
      prevSafeModeRef.current !== safeMode ||
      prevCompileModeRef.current !== compileMode
    prevTemplateRef.current = template
    prevVariantRef.current = headingVariant
    prevPageSizeRef.current = pageSize
    prevMarginRef.current = marginPreset
    prevSafeModeRef.current = safeMode
    prevCompileModeRef.current = compileMode
    if (changed && pdfUrl) setStatus('compiling')
  }, [template, headingVariant, pageSize, marginPreset, safeMode, compileMode, stage, pdfUrl])

  // ── Shared handler for setting PDF blob/URL from a successful response ──
  const handlePdfBlob = useCallback((blob: Blob, resp: Response, downloadAfter: boolean) => {
    pdfBlobRef.current = blob
    const url = URL.createObjectURL(blob)
    setPdfUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url })
    setStatus('success')
    setErrors([])
    if (downloadAfter) {
      const a = document.createElement('a')
      a.href = url
      a.download = buildFilename(title, template, pageSize)
      document.body.appendChild(a)
      a.click()
      a.remove()
      const wasWatermarked = resp.headers.get('x-pp-watermarked') === 'true'
      setLastDownloadWatermarked(wasWatermarked)
      const remaining = resp.headers.get('x-pp-credits-remaining')
      if (remaining !== null) {
        refreshUser()
      }
    } else {
      setLastDownloadWatermarked(false)
    }
  }, [title, template, pageSize, refreshUser])

  // ── The compile function ──
  const compile = useCallback(async (downloadAfter: boolean, exportPlatform?: Platform, _isAutoRetry?: boolean) => {
    // ╔═ H5: compile() invoked ═╗
    debugLog('H5', 'compile() called', { downloadAfter, _isAutoRetry: !!_isAutoRetry, template, pageSize, compileMode })

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const gen = ++compileGenRef.current
    // Reset retry counter on fresh user-initiated compiles (not auto-retries)
    if (!_isAutoRetry) retryCountRef.current = 0

    setLoading(true)
    setStatus('compiling')
    setErrors([])

    try {
      const effectiveMd = adjustHeadingsForTemplate(manuscript, template)
      const body: Record<string, unknown> = {
        manuscriptText: effectiveMd,
        template,
        headingVariant,
        title: title || 'Manuscript',
        pageSize,
        marginPreset,
        safeMode,
        compileMode,
      }
      if (downloadAfter) body.download = true
      if (exportPlatform === 'ingram') body.outputFormat = 'pdfx1a'
      if (customFont) body.customFonts = { main: customFont.fontId }
      if (assets.length > 0) body.assets = assets.map(a => a.assetId)

      const fetchHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
      if (isPocketBaseConfigured) {
        const pb = createClient()
        if (pb.authStore.isValid && pb.authStore.token) {
          fetchHeaders['Authorization'] = `Bearer ${pb.authStore.token}`
        }
      }

      // Phase 1: Submit
      const resp = await fetch('/api/compile', {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      // ╔═ H1: POST response received ═╗
      const ct = resp.headers.get('content-type') || '(none)'
      debugLog('H1', 'POST /api/compile response', { status: resp.status, ok: resp.ok, contentType: ct })

      if (gen !== compileGenRef.current) return

      // Sync fallback: PDF returned directly
      if (resp.ok && resp.headers.get('content-type')?.includes('application/pdf')) {
        debugLog('H1', 'Sync PDF received directly', { size: 'streaming' })
        const blob = await resp.blob()
        if (gen !== compileGenRef.current) return
        handlePdfBlob(blob, resp, downloadAfter)
        return
      }
      if (resp.ok && resp.headers.get('content-type')?.includes('application/epub')) {
        debugLog('H1', 'Sync EPUB received directly', { size: 'streaming' })
        const blob = await resp.blob()
        if (gen !== compileGenRef.current) return
        handlePdfBlob(blob, resp, downloadAfter)
        return
      }

      // Handle immediate rejection
      if (!resp.ok && resp.status !== 202) {
        const payload = await resp.json().catch(() => null)
        // ╔═ H1: POST rejected ═╗
        debugLog('H1', 'POST rejected', { status: resp.status, payload })

        pdfBlobRef.current = null
        const msgs: CompileError[] = []
        // Prefer structured errors from backend
        if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
          for (const e of payload.errors) {
            msgs.push({ message: e.message, fix: e.fix || null, severity: e.severity, category: e.category })
          }
        } else if (payload?.message) {
          msgs.push({ message: payload.message })
        }
        if (!msgs.length) msgs.push({ message: `Compile failed (${resp.status}).` })
        if (payload?.detail) msgs.push({ message: `__detail__${payload.detail}` })
        setErrors(msgs)
        setStatus('error')
        return
      }

      // Phase 2: Async Polling (202 Accepted)
      const { jobId, resultSecret } = await resp.json()
      // ╔═ H2: 202 body parsed ═╗
      debugLog('H2', '202 body parsed', { jobId, hasJobId: typeof jobId === 'string' && jobId.length > 0, hasSecret: !!resultSecret })
      setStatus('queued')

      const delays = [500, 1000, 2000, 3000, 5000]
      let pollIndex = 0
      let networkErrors = 0
      const maxPolls = 60 // ~3 minutes max polling time

      while (pollIndex < maxPolls) {
        if (gen !== compileGenRef.current) return

        const delay = delays[Math.min(pollIndex, delays.length - 1)]
        await abortableDelay(delay, controller.signal)
        pollIndex++

        try {
          const statusResp = await fetch(`/api/compile/status/${jobId}`, {
            signal: controller.signal,
          })
          if (gen !== compileGenRef.current) return

          if (!statusResp.ok) {
            if (statusResp.status === 404 || statusResp.status === 410) {
              // ╔═ H3: Status poll 404/410 ═╗
              debugLog('H3', 'Status poll returned 404/410', { jobId, pollIndex, status: statusResp.status, retryCount: retryCountRef.current })

              // Job expired from server memory — auto-recompile silently
              if (retryCountRef.current < 1) {
                retryCountRef.current++
                setStatus('compiling')
                setTimeout(() => { void compileRef.current(false, undefined, true) }, 300)
                return
              }
              // Already retried once — show a quiet message
              pdfBlobRef.current = null
              setErrors([{ message: 'Preview expired. Click Retry to recompile.', isSoft: true }])
              setStatus('error')
              return
            }
            networkErrors++
            if (networkErrors > 3) throw new Error('Lost connection to compile server.')
            continue
          }

          networkErrors = 0
          const statusData = await statusResp.json()

          if (statusData.status === 'waiting' || statusData.status === 'delayed') {
            setStatus('queued')
            continue
          }

          if (statusData.status === 'active') {
            setStatus('compiling')
            continue
          }

          if (statusData.status === 'failed') {
            debugLog('H3', 'Job failed', { jobId, statusData })
            pdfBlobRef.current = null
            const msgs: CompileError[] = []
            // Prefer structured errors from backend
            if (Array.isArray(statusData.errors) && statusData.errors.length > 0) {
              for (const e of statusData.errors) {
                msgs.push({ message: e.message, fix: e.fix || null, severity: e.severity, category: e.category })
              }
            } else if (statusData.message) {
              msgs.push({ message: statusData.message })
            }
            if (!msgs.length) msgs.push({ message: 'Compilation failed.' })
            if (statusData.detail) msgs.push({ message: `__detail__${statusData.detail}` })
            setErrors(msgs)
            setStatus('error')
            return
          }

          if (statusData.status === 'completed') {
            // Capture quality metrics from status response
            if (statusData.typographyReport || statusData.compileLog || statusData.buildId) {
              setQuality({
                typographyScore: statusData.typographyReport?.score ?? null,
                typographyGrade: statusData.typographyReport?.grade ?? null,
                overfullBoxes: statusData.compileLog?.overfull ?? 0,
                underfullBoxes: statusData.compileLog?.underfull ?? 0,
                buildId: statusData.buildId ?? null,
              })
            }

            // ╔═ H4: Status completed — about to fetch result ═╗
            debugLog('H4', 'Status completed, fetching result', { jobId })

            setStatus('compiling')

            // Phase 3: Fetch final PDF
            const resultHeaders = { ...fetchHeaders }
            if (resultSecret) resultHeaders['x-pp-result-secret'] = resultSecret
            const pdfResp = await fetch(`/api/compile/result/${jobId}`, {
              headers: resultHeaders,
              signal: controller.signal,
            })
            if (gen !== compileGenRef.current) return

            if (!pdfResp.ok) {
              // ╔═ H4: Result fetch not ok ═╗
              debugLog('H4', 'Result fetch failed', { jobId, status: pdfResp.status })

              // Expired/missing result — auto-recompile silently (once)
              if ((pdfResp.status === 404 || pdfResp.status === 410) && retryCountRef.current < 1) {
                retryCountRef.current++
                setStatus('compiling')
                setTimeout(() => { void compileRef.current(downloadAfter, undefined, true) }, 300)
                return
              }
              let payload: { message?: string; detail?: string } | null = null
              try { payload = await pdfResp.json() } catch { /* noop */ }
              pdfBlobRef.current = null
              const msgs: CompileError[] = []
              if (pdfResp.status === 404 || pdfResp.status === 410) {
                msgs.push({ message: 'Preview expired. Click Retry to recompile.', isSoft: true })
              } else {
                if (payload?.message) msgs.push({ message: payload.message })
                if (!msgs.length) msgs.push({ message: 'Failed to retrieve compiled PDF.' })
              }
              if (payload?.detail) msgs.push({ message: `__detail__${payload.detail}` })
              setErrors(msgs)
              setStatus('error')
              return
            }

            const blob = await pdfResp.blob()
            if (gen !== compileGenRef.current) return

            debugLog('H4', 'PDF blob received', { jobId, blobSize: blob.size })
            handlePdfBlob(blob, pdfResp, downloadAfter)
            return
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return
          networkErrors++
          if (networkErrors > 3) {
            pdfBlobRef.current = null
            setErrors([{ message: 'Network disconnected.', fix: 'Check your internet connection and retry.', severity: 'error', category: 'network' }])
            setStatus('error')
            return
          }
        }
      }

      // Polling exhausted — compile took too long
      pdfBlobRef.current = null
      setErrors([{ message: 'Compilation timed out. Please try again.', fix: 'Try Fast compile mode, or split into smaller sections.', severity: 'error', category: 'timeout' }])
      setStatus('error')
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      // ╔═ H1: Outer catch — compile threw ═╗
      if (e instanceof Error && e.name !== 'AbortError') {
        debugLog('H1', 'compile() threw', { name: e.name, message: e.message })
        pdfBlobRef.current = null
        setErrors([{ message: 'Network or server error. Please try again.', fix: 'Check your connection or try again.', severity: 'error', category: 'network' }])
        setStatus('error')
      }
    } finally {
      setLoading(false)
    }
  }, [manuscript, template, headingVariant, title, pageSize, marginPreset, safeMode, compileMode, customFont, assets, handlePdfBlob])

  // Keep a ref to the latest compile so the debounce timer always calls the current version
  const compileRef = useRef(compile)
  compileRef.current = compile

  // ── Debounced auto-compile in design stage ──
  const prevManuscriptRef = useRef(manuscript)
  useEffect(() => {
    if (stage !== 'design' || !manuscript.trim()) return
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    const isTextChange = prevManuscriptRef.current !== manuscript
    prevManuscriptRef.current = manuscript
    const delay = isTextChange ? 3000 : 1500
    debounceRef.current = window.setTimeout(() => { void compileRef.current(false) }, delay)
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manuscript, template, headingVariant, title, pageSize, marginPreset, safeMode, compileMode, stage])

  return {
    loading,
    status,
    errors,
    pdfUrl,
    pdfBlobRef,
    lastDownloadWatermarked,
    quality,
    compile,
  }
}
