'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

import type {
  TemplateKey, HeadingVariant, PageSize, MarginPreset,
  CompileMode, CustomFont, Status, CompileError, Stage, Platform,
  CompileQuality,
} from './editor-types'
import { adjustHeadingsForTemplate, buildFilename, abortableDelay } from './editor-utils'
import { createClient, isPocketBaseConfigured } from '@/lib/supabase'

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
  stage: Stage
  refreshUser: () => void
}

export function useCompileQueue({
  manuscript, template, headingVariant, title, pageSize, marginPreset,
  safeMode, compileMode, customFont, stage, refreshUser,
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
  const compile = useCallback(async (downloadAfter: boolean, exportPlatform?: Platform) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const gen = ++compileGenRef.current

    setLoading(true)
    setStatus('compiling')
    setErrors([])

    let retried = false

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

      if (gen !== compileGenRef.current) return

      // Sync fallback: PDF returned directly
      if (resp.ok && resp.headers.get('content-type')?.includes('application/pdf')) {
        const blob = await resp.blob()
        if (gen !== compileGenRef.current) return
        handlePdfBlob(blob, resp, downloadAfter)
        return
      }
      if (resp.ok && resp.headers.get('content-type')?.includes('application/epub')) {
        const blob = await resp.blob()
        if (gen !== compileGenRef.current) return
        handlePdfBlob(blob, resp, downloadAfter)
        return
      }

      // Handle immediate rejection
      if (!resp.ok && resp.status !== 202) {
        const payload = await resp.json().catch(() => null)
        pdfBlobRef.current = null
        const msgs: CompileError[] = []
        if (payload?.message) msgs.push({ message: payload.message })
        if (!msgs.length) msgs.push({ message: `Compile failed (${resp.status}).` })
        if (payload?.detail) msgs.push({ message: `__detail__${payload.detail}` })
        setErrors(msgs)
        setStatus('error')
        return
      }

      // Phase 2: Async Polling (202 Accepted)
      const { jobId } = await resp.json()
      setStatus('queued')

      const delays = [500, 1000, 2000, 3000, 5000]
      let pollIndex = 0
      let networkErrors = 0

      while (true) {
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
            // 404 = job expired from server memory — auto-recompile once
            if (statusResp.status === 404 && !retried) {
              retried = true
              setStatus('compiling')
              setTimeout(() => { void compile(downloadAfter, exportPlatform) }, 300)
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
            pdfBlobRef.current = null
            const msgs: CompileError[] = []
            if (statusData.message) msgs.push({ message: statusData.message })
            if (statusData.error && statusData.error !== 'worker_error') msgs.push({ message: statusData.error })
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

            setStatus('compiling')

            // Phase 3: Fetch final PDF
            const pdfResp = await fetch(`/api/compile/result/${jobId}`, {
              headers: fetchHeaders,
              signal: controller.signal,
            })
            if (gen !== compileGenRef.current) return

            if (!pdfResp.ok) {
              // Auto-retry on expired/restarted results (410) — recompile once
              if ((pdfResp.status === 410 || pdfResp.status === 404) && !retried) {
                retried = true
                setStatus('compiling')
                // Re-submit the compile instead of showing "expired" to the user
                setTimeout(() => { void compile(downloadAfter, exportPlatform) }, 300)
                return
              }
              let payload: { message?: string; detail?: string } | null = null
              try { payload = await pdfResp.json() } catch { /* noop */ }
              pdfBlobRef.current = null
              const msgs: CompileError[] = []
              if (payload?.message) msgs.push({ message: payload.message })
              if (!msgs.length) msgs.push({ message: 'Failed to retrieve compiled PDF.' })
              setErrors(msgs)
              setStatus('error')
              return
            }

            const blob = await pdfResp.blob()
            if (gen !== compileGenRef.current) return

            handlePdfBlob(blob, pdfResp, downloadAfter)
            return
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return
          networkErrors++
          if (networkErrors > 3) {
            pdfBlobRef.current = null
            setErrors([{ message: 'Network disconnected.' }])
            setStatus('error')
            return
          }
        }
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      if (e instanceof Error && e.name !== 'AbortError') {
        pdfBlobRef.current = null
        setErrors([{ message: 'Network or server error. Please try again.' }])
        setStatus('error')
      }
    } finally {
      setLoading(false)
    }
  }, [manuscript, template, headingVariant, title, pageSize, marginPreset, safeMode, compileMode, customFont, handlePdfBlob])

  // ── Debounced auto-compile in design stage ──
  const prevManuscriptRef = useRef(manuscript)
  useEffect(() => {
    if (stage !== 'design' || !manuscript.trim()) return
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    const isTextChange = prevManuscriptRef.current !== manuscript
    prevManuscriptRef.current = manuscript
    const delay = isTextChange ? 3000 : 1500
    debounceRef.current = window.setTimeout(() => { void compile(false) }, delay)
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
