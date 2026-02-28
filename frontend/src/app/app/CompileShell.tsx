'use client'

/* ═══════════════════════════════════════════════════════════════════
   COMPILE SHELL — Swiss Typographic Control Panel
   Single-screen workspace: ControlStrip (left) + Preview (right)
   No stages. No overlays. The book is always visible.
   ═══════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import CompositorMark from '@/components/CompositorMark'
import { AnimatePresence } from 'framer-motion'
import { Download, Loader2, Cloud, CloudOff, ArrowLeft } from 'lucide-react'

import { SAMPLES } from './sample'
import { useAuth } from '@/lib/auth-context'
import { loadManuscript as loadLocalManuscript, saveManuscript as saveLocalManuscript, loadAssets as loadLocalAssets, saveAssets as saveLocalAssets } from '@/lib/manuscript-store'
import { useManuscript } from '@/lib/use-manuscript'
import type { ManuscriptListItem } from '@/lib/use-manuscript'

import type {
  TemplateKey, HeadingVariant, PageSize, MarginPreset,
  CompileMode, CustomFont, Platform, Prefs, Asset,
} from './editor-types'
import { TEMPLATE_INFO, TEMPLATE_KEYS, PAGE_SIZES, MARGIN_INFO, PREFS_KEY, hasTier } from './editor-types'
import { cleanFromWord, analyzeManuscript } from './editor-utils'

import ControlStrip from './ControlStrip'
import StatusBar from './StatusBar'
import PortalStage from './PortalStage'
import PreviewPane from './PreviewPane'
import ManuscriptBrowser from './ManuscriptBrowser'
import { useCompileQueue } from './useCompileQueue'

/* ═══════════════════════════════════════════════════════════════════
   MAIN SHELL — Single-screen workspace
   ═══════════════════════════════════════════════════════════════════ */

export default function CompileShell() {
  const searchParams = useSearchParams()

  // ── Core state ──
  const [manuscript, setManuscript] = useState('')
  const [template, setTemplate] = useState<TemplateKey>('symphony')
  const [headingVariant, setHeadingVariant] = useState<HeadingVariant>('classic')
  const [title, setTitle] = useState<string>('')
  const [pageSize, setPageSize] = useState<PageSize>('sixByNine')
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('normal')
  const [safeMode, setSafeMode] = useState<boolean>(true)
  const [compileMode, setCompileMode] = useState<CompileMode>('fast')
  const [customFont, setCustomFont] = useState<CustomFont>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [fontUploading, setFontUploading] = useState(false)
  const [targetPlatform, setTargetPlatform] = useState<Platform | null>(null)

  // ── UI state ──
  const [mounted, setMounted] = useState(false)
  const [clientIsMobile, setClientIsMobile] = useState(false)
  const [mobileGateDismissed, setMobileGateDismissed] = useState(false)
  const [showManuscripts, setShowManuscripts] = useState(false)
  const [manuscriptList, setManuscriptList] = useState<ManuscriptListItem[]>([])
  const [manuscriptListLoading, setManuscriptListLoading] = useState(false)

  // ── Auth & persistence ──
  const { user, tier, publisherWindowEnd, refreshUser } = useAuth()
  const {
    manuscriptId,
    loadManuscript,
    listManuscripts,
    saveManuscript,
    deleteManuscript,
    newManuscript,
    saving: manuscriptSaving,
    saveError: manuscriptSaveError,
  } = useManuscript(user?.id ?? null)

  // ── Compile queue ──
  // We always pass stage='design' since there are no stages anymore
  const {
    loading,
    status,
    errors,
    debug,
    pdfUrl,
    lastDownloadWatermarked,
    quality,
    compile,
  } = useCompileQueue({
    manuscript, template, headingVariant, title, pageSize, marginPreset,
    safeMode, compileMode, customFont, assets, stage: 'design', refreshUser,
  })

  // ── Mount & mobile detection ──
  useEffect(() => {
    setMounted(true)
    setClientIsMobile(typeof window !== 'undefined' && window.innerWidth < 768)
    const onResize = () => setClientIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── URL template param ──
  useEffect(() => {
    const urlTemplate = searchParams.get('template')
    if (urlTemplate && urlTemplate in TEMPLATE_INFO) {
      setTemplate(urlTemplate as TemplateKey)
    }
  }, [searchParams])

  // ── Load saved prefs + manuscript on mount ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY)
      if (raw) {
        const p: Partial<Prefs> = JSON.parse(raw)
        if (p.template) setTemplate(p.template)
        if (p.headingVariant) setHeadingVariant(p.headingVariant)
        if (p.pageSize) setPageSize(p.pageSize)
        if (p.marginPreset) setMarginPreset(p.marginPreset)
        if (typeof p.safeMode === 'boolean') setSafeMode(p.safeMode)
        if (typeof p.title === 'string' && p.title.trim()) setTitle(p.title)
      }
    } catch { /* ignore */ }
    loadLocalManuscript().then(({ manuscript: savedMs, title: savedTitle }) => {
      if (savedMs && savedMs.trim()) setManuscript(savedMs)
      if (savedTitle && savedTitle.trim()) setTitle(savedTitle)
    })
    loadLocalAssets().then(savedAssets => {
      if (savedAssets.length > 0) setAssets(savedAssets)
    })
  }, [])

  // ── Save preferences ──
  useEffect(() => {
    if (!manuscript) return
    const prefs: Prefs = { template, pageSize, marginPreset, safeMode, title, headingVariant }
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)) } catch { /* ignore */ }
  }, [template, headingVariant, pageSize, marginPreset, safeMode, title, manuscript])

  // ── Auto-save manuscript (3s debounce) ──
  const manuscriptSaveRef = useRef<number | null>(null)
  useEffect(() => {
    if (!manuscript) return
    if (manuscriptSaveRef.current) window.clearTimeout(manuscriptSaveRef.current)
    manuscriptSaveRef.current = window.setTimeout(() => {
      saveLocalManuscript(manuscript, title)
      saveManuscript({
        id: null, title, content: manuscript,
        template, pageSize, marginPreset, safeMode,
      })
    }, 3000)
    return () => { if (manuscriptSaveRef.current) window.clearTimeout(manuscriptSaveRef.current) }
  }, [manuscript, title, template, pageSize, marginPreset, safeMode, saveManuscript])

  // ── Save assets to IndexedDB ──
  useEffect(() => {
    void saveLocalAssets(assets)
  }, [assets])

  // ── Keyboard shortcuts ──
  useEffect(() => {
    if (!manuscript) return // No shortcuts when empty state

    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const idx = TEMPLATE_KEYS.indexOf(template)

      switch (e.key) {
        case 'ArrowLeft': {
          e.preventDefault()
          const prev = (idx - 1 + TEMPLATE_KEYS.length) % TEMPLATE_KEYS.length
          setTemplate(TEMPLATE_KEYS[prev])
          break
        }
        case 'ArrowRight': {
          e.preventDefault()
          const next = (idx + 1) % TEMPLATE_KEYS.length
          setTemplate(TEMPLATE_KEYS[next])
          break
        }
        case ' ': {
          e.preventDefault()
          void compile(false)
          break
        }
        case 'Escape': {
          setShowManuscripts(false)
          break
        }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manuscript, template])

  const wordCount = manuscript.split(/\s+/).filter(w => w.length > 0).length

  // ── Handlers ──

  function handleFileAccepted(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'docx') {
      // Convert .docx via API
      file.arrayBuffer().then(async (buf) => {
        try {
          const resp = await fetch('/api/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: buf,
          })
          if (!resp.ok) return
          const { markdown } = await resp.json()
          if (markdown) handleTextAccepted(markdown)
        } catch { /* ignore */ }
      })
    } else {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result
        if (typeof result === 'string') handleTextAccepted(result)
      }
      reader.readAsText(file)
    }
  }

  function handleTextAccepted(raw: string) {
    const cleaned = cleanFromWord(raw)
    setManuscript(cleaned)
    // Auto-detect genre and set template
    const analysis = analyzeManuscript(cleaned)
    if (analysis.detected?.template) {
      setTemplate(analysis.detected.template)
    }
    if (!title) setTitle('My Manuscript')
  }

  function handleLoadSample(sampleKey: string) {
    const sample = SAMPLES.find(s => s.key === sampleKey) || SAMPLES[0]
    setManuscript(sample.md)
    setTitle(sample.title)
    setTemplate(sample.template)
  }

  async function handleOpenManuscripts() {
    setShowManuscripts(true)
    setManuscriptListLoading(true)
    const list = await listManuscripts()
    setManuscriptList(list)
    setManuscriptListLoading(false)
  }

  async function handleLoadManuscript(id: string) {
    const loaded = await loadManuscript(id)
    if (loaded) {
      setManuscript(loaded.content)
      setTitle(loaded.title)
      if (loaded.template in TEMPLATE_INFO) setTemplate(loaded.template as TemplateKey)
      if (loaded.pageSize in PAGE_SIZES) setPageSize(loaded.pageSize as PageSize)
      if (loaded.marginPreset in MARGIN_INFO) setMarginPreset(loaded.marginPreset as MarginPreset)
      setSafeMode(loaded.safeMode)
      setShowManuscripts(false)
    }
  }

  async function handleDeleteManuscript(id: string) {
    await deleteManuscript(id)
    setManuscriptList(prev => prev.filter(m => m.id !== id))
  }

  function handleNewManuscript() {
    newManuscript()
    setManuscript('')
    setTitle('')
    setShowManuscripts(false)
  }

  function handlePortalAccept(text: string, inTitle: string, detectedTemplate?: TemplateKey) {
    setManuscript(text)
    if (inTitle) setTitle(inTitle)
    if (detectedTemplate) setTemplate(detectedTemplate)
  }

  function handleDownload(exportPlatform?: Platform) {
    compile(true, exportPlatform)
  }

  async function handleFontUpload(file: File) {
    setFontUploading(true)
    try {
      const form = new FormData()
      form.append('font', file)
      const resp = await fetch('/api/fonts/upload', { method: 'POST', body: form })
      if (!resp.ok) {
        const data = await resp.json().catch(() => null)
        alert(data?.error || 'Font upload failed.')
        return
      }
      const data = await resp.json()
      setCustomFont({ fontId: data.fontId, fontName: data.fontName, originalName: data.originalName })
    } catch {
      alert('Font upload failed. Please try again.')
    } finally {
      setFontUploading(false)
    }
  }

  // ── Mobile gate ──
  if (mounted && clientIsMobile && !mobileGateDismissed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505] px-6">
        <div className="max-w-md text-center">
          <CompositorMark size={32} className="mx-auto mb-8 invert opacity-30" />
          <h1 className="font-display text-2xl font-bold text-white/90">Desktop Required</h1>
          <p className="mt-4 font-body text-sm leading-relaxed text-white/50">
            PagePerfect&rsquo;s editor requires a desktop browser for the full typesetting experience.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Link href="/" className="inline-flex h-10 items-center px-6 font-mono text-[11px] uppercase tracking-[0.1em] text-white/60 transition-colors hover:text-white">
              Back to Home
            </Link>
            <button onClick={() => setMobileGateDismissed(true)} className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/25 transition-colors hover:text-white/50">
              Continue anyway
            </button>
          </div>
        </div>
      </div>
    )
  }

  const hasManuscript = manuscript.trim().length > 0

  // ── RENDER: The Single-Screen Workspace ──

  return (
    <div className="fixed inset-0 flex flex-col bg-[#FDFCF8]">
      {/* ── TopBar ────────────────────────────────────────── */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#e5e5e0] px-4">
        {/* Left: home + title */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center text-[#111111]/50 transition-colors duration-200 hover:text-[#111111]/70"
            title="Home"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <div className="h-4 w-px bg-[#e5e5e0]" />
          {hasManuscript ? (
            <>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="max-w-[200px] bg-transparent font-display text-sm font-semibold text-[#111111]/70 placeholder:text-[#111111]/50 focus:text-[#111111] focus:outline-none"
                placeholder="Untitled"
              />
              <span className="hidden font-mono text-[9px] uppercase tracking-[0.1em] text-[#111111]/50 sm:inline">
                {wordCount.toLocaleString()} words
              </span>
              {/* Cloud sync */}
              {!!user && (
                <>
                  <div className="h-3 w-px bg-[#e5e5e0]" />
                  {manuscriptSaving ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin text-[#111111]/50" />
                  ) : manuscriptSaveError ? (
                    <span title={manuscriptSaveError || undefined}><CloudOff className="h-2.5 w-2.5 text-red-500/50" /></span>
                  ) : (
                    <span title="Synced"><Cloud className="h-2.5 w-2.5 text-emerald-600/40" /></span>
                  )}
                </>
              )}
            </>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#111111]/50">PagePerfect</span>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* New manuscript — available to all users when a manuscript is loaded */}
          {hasManuscript && (
            <button
              onClick={handleNewManuscript}
              className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#111111]/50 transition-colors duration-200 hover:text-[#111111]/70"
            >
              New
            </button>
          )}
          {/* My manuscripts */}
          {!!user && (
            <button
              onClick={handleOpenManuscripts}
              className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#111111]/50 transition-colors duration-200 hover:text-[#111111]/70"
            >
              Manuscripts
            </button>
          )}

          {hasManuscript && (
            <>
              <div className="h-3 w-px bg-[#e5e5e0]" />
              {/* Compile button */}
              <button
                onClick={() => compile(false)}
                disabled={loading}
                className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#111111]/50 transition-colors duration-200 hover:text-[#111111]/70 disabled:opacity-30"
              >
                {loading ? <Loader2 className="inline h-3 w-3 animate-spin" /> : 'Compile'}
              </button>

              {/* Download button — always visible, THE red CTA */}
              <button
                onClick={() => handleDownload(targetPlatform || 'kdp')}
                disabled={status !== 'success'}
                className="flex h-8 items-center gap-1.5 bg-[#FF3333] px-4 font-mono text-[9px] uppercase tracking-[0.1em] text-white transition-all duration-200 hover:bg-[#E52222] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Download className="h-3 w-3" />
                <span className="hidden sm:inline">Download PDF</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Main workspace ─────────────────────────────── */}
      {hasManuscript ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Control strip */}
          <ControlStrip
            manuscript={manuscript}
            onManuscriptChange={setManuscript}
            onFileUpload={handleFileAccepted}
            assets={assets}
            onAssetsChange={setAssets}
            template={template}
            headingVariant={headingVariant}
            onTemplateChange={setTemplate}
            onHeadingVariantChange={setHeadingVariant}
            pageSize={pageSize}
            marginPreset={marginPreset}
            onPageSizeChange={setPageSize}
            onMarginChange={setMarginPreset}
            userTier={tier}
            compileMode={compileMode}
            safeMode={safeMode}
            customFont={customFont}
            fontUploading={fontUploading}
            onCompileModeChange={setCompileMode}
            onSafeModeChange={setSafeMode}
            onFontUpload={handleFontUpload}
            onFontRemove={() => setCustomFont(null)}
            status={status}
            quality={quality}
            pdfUrl={pdfUrl}
            lastDownloadWatermarked={lastDownloadWatermarked}
            publisherWindowEnd={publisherWindowEnd}
            wordCount={wordCount}
            manuscriptText={manuscript}
            title={title}
            customFontForExport={customFont}
            safeModeForExport={safeMode}
            compileModeForExport={compileMode}
            headingVariantForExport={headingVariant}
            onDownload={handleDownload}
            targetPlatform={targetPlatform}
          />

          {/* Right: Preview */}
          <div className="relative flex-1">
            <PreviewPane
              pdfUrl={pdfUrl}
              loading={loading}
              status={status}
              errors={errors}
              debug={debug}
              isWatermarked={!hasTier(tier, 'publisher') && !!pdfUrl}
              quality={quality}
              onRetry={() => compile(false)}
              sideBySide={false}
            />
          </div>
        </div>
      ) : (
        /* ── Ingestion gate: full-screen when no manuscript ── */
        <PortalStage
          onAccept={handlePortalAccept}
          onLoadSample={handleLoadSample}
          onOpenManuscripts={user ? handleOpenManuscripts : undefined}
          isLoggedIn={!!user}
          onPlatformSelect={setTargetPlatform}
        />
      )}

      {/* ── Status bar ────────────────────────────────────── */}
      {hasManuscript && (
        <StatusBar status={status} quality={quality} />
      )}

      {/* ── Manuscript browser modal ──────────────────────── */}
      <AnimatePresence>
        {showManuscripts && (
          <ManuscriptBrowser
            visible={showManuscripts}
            manuscripts={manuscriptList}
            loading={manuscriptListLoading}
            currentId={manuscriptId}
            onLoad={handleLoadManuscript}
            onDelete={handleDeleteManuscript}
            onNew={handleNewManuscript}
            onClose={() => setShowManuscripts(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
