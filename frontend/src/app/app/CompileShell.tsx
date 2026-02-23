'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import CompositorMark from '@/components/CompositorMark'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard, ChevronLeft, ChevronRight, X } from 'lucide-react'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('./RichTextEditor'), { ssr: false })

import { SAMPLES } from './sample'
import PublishingSystems from './PublishingSystems'
import { useAuth } from '@/lib/auth-context'
import { loadManuscript as loadLocalManuscript, saveManuscript as saveLocalManuscript } from '@/lib/manuscript-store'
import { useManuscript } from '@/lib/use-manuscript'
import type { ManuscriptListItem } from '@/lib/use-manuscript'

// Decomposed modules
import type {
  TemplateKey, HeadingVariant, PageSize, MarginPreset,
  CompileMode, Stage, HudTab, CustomFont, Platform, Prefs,
} from './editor-types'
import { TEMPLATE_INFO, TEMPLATE_KEYS, PAGE_SIZES, MARGIN_INFO, PREFS_KEY, hasTier } from './editor-types'
import PortalStage from './PortalStage'
import PreviewPane from './PreviewPane'
import FloatingHUD from './FloatingHUD'
import TopBar from './TopBar'
import LaunchOverlay from './LaunchOverlay'
import ManuscriptBrowser from './ManuscriptBrowser'
import { useCompileQueue } from './useCompileQueue'

/* ═══════════════════════════════════════════════════════════════════
   LAYER 0: THE VOID — Background canvas
   ═══════════════════════════════════════════════════════════════════ */

function VoidLayer({ gridVisible }: { gridVisible: boolean }) {
  return (
    <div className="fixed inset-0 -z-10 bg-[#FDFCF8]">
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: gridVisible ? 0.06 : 0,
          backgroundImage:
            'linear-gradient(to right, #111111 1px, transparent 1px), linear-gradient(to bottom, #111111 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: gridVisible ? 1 : 0.4,
          background: 'radial-gradient(ellipse 900px 700px at 50% 45%, rgba(255,255,255,0.5), transparent)',
        }}
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS LEGEND
   ═══════════════════════════════════════════════════════════════════ */

function ShortcutLegend({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  if (!visible) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="fixed bottom-24 right-6 z-50 border border-[#111111]/10 bg-white p-4 shadow-elevated backdrop-blur-xl"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#111111]/30">Shortcuts</span>
        <button onClick={onClose} className="text-[#111111]/25 hover:text-[#111111]/50">
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="space-y-1.5 font-mono text-[11px]">
        {[
          ['Left / Right', 'Cycle templates'],
          ['Space', 'Recompile'],
          ['E', 'Toggle editor'],
          ['S', 'Publishing systems'],
          ['P', 'Export / publish'],
          ['?', 'Toggle shortcuts'],
          ['Esc', 'Close panel'],
        ].map(([key, desc]) => (
          <div key={key} className="flex items-center gap-3">
            <kbd className="rounded bg-[#111111]/[0.06] px-1.5 py-0.5 text-[10px] text-[#111111]/40">{key}</kbd>
            <span className="text-[#111111]/30">{desc}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MANUSCRIPT EDITOR OVERLAY
   ═══════════════════════════════════════════════════════════════════ */

function EditorOverlay({
  manuscript,
  onChange,
  onClose,
}: {
  manuscript: string
  onChange: (m: string) => void
  onClose: () => void
}) {
  const [editorMode, setEditorMode] = useState<'markdown' | 'richtext'>('markdown')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 flex"
    >
      <div className="flex w-1/2 flex-col border-r border-[#111111]/[0.08] bg-white">
        {editorMode === 'markdown' ? (
          <>
            <div className="flex items-center justify-between border-b border-[#111111]/[0.06] px-5 py-2.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#111111]/30">Markdown</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setEditorMode('richtext')}
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111]/30 hover:text-[#111111]/50"
                >
                  Switch to Rich Text
                </button>
                <button onClick={onClose} className="font-mono text-[11px] text-[#111111]/30 hover:text-[#111111]/50">
                  Close
                </button>
              </div>
            </div>
            <textarea
              value={manuscript}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 resize-none bg-transparent p-6 font-mono text-sm leading-[1.8] text-[#111111]/70 caret-[#FF3333] focus:outline-none"
              placeholder="# Chapter One&#10;&#10;Write here..."
              autoFocus
            />
          </>
        ) : (
          <RichTextEditor
            markdown={manuscript}
            onChange={onChange}
            onClose={() => setEditorMode('markdown')}
          />
        )}
      </div>
      <div className="w-1/2" onClick={onClose} />
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN SHELL — THE LAYER CAKE ORCHESTRATOR
   ═══════════════════════════════════════════════════════════════════ */

export default function CompileShell() {
  const searchParams = useSearchParams()
  const [stage, setStage] = useState<Stage>('portal')
  const [manuscript, setManuscript] = useState('')
  const [template, setTemplate] = useState<TemplateKey>('symphony')
  const [headingVariant, setHeadingVariant] = useState<HeadingVariant>('classic')
  const [title, setTitle] = useState<string>('')
  const [pageSize, setPageSize] = useState<PageSize>('sixByNine')
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('normal')
  const [safeMode, setSafeMode] = useState<boolean>(true)
  const [compileMode, setCompileMode] = useState<CompileMode>('fast')
  const [hudTab, setHudTab] = useState<HudTab>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showSystems, setShowSystems] = useState(false)
  const [customFont, setCustomFont] = useState<CustomFont>(null)
  const [fontUploading, setFontUploading] = useState(false)
  const [mobileGateDismissed, setMobileGateDismissed] = useState(false)
  const [showManuscripts, setShowManuscripts] = useState(false)
  const [manuscriptList, setManuscriptList] = useState<ManuscriptListItem[]>([])
  const [manuscriptListLoading, setManuscriptListLoading] = useState(false)
  const [targetPlatform, setTargetPlatform] = useState<Platform | null>(null)

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

  // ── Compile queue hook — encapsulates compile, debounce, polling ──
  const {
    loading,
    status,
    errors,
    pdfUrl,
    lastDownloadWatermarked,
    quality,
    compile,
  } = useCompileQueue({
    manuscript, template, headingVariant, title, pageSize, marginPreset,
    safeMode, compileMode, customFont, stage, refreshUser,
  })

  // Read template from URL params
  useEffect(() => {
    const urlTemplate = searchParams.get('template')
    if (urlTemplate && urlTemplate in TEMPLATE_INFO) {
      setTemplate(urlTemplate as TemplateKey)
    }
  }, [searchParams])

  // Load saved preferences and manuscript on mount
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
  }, [])

  // Save preferences
  useEffect(() => {
    if (stage === 'portal') return
    const prefs: Prefs = { template, pageSize, marginPreset, safeMode, title, headingVariant }
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)) } catch { /* ignore */ }
  }, [template, headingVariant, pageSize, marginPreset, safeMode, title, stage])

  // Auto-save manuscript to IndexedDB + PocketBase (3s debounce)
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

  // Keyboard shortcuts (design stage)
  useEffect(() => {
    if (stage !== 'design') return

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
        case 'e':
        case 'E': {
          setShowEditor(prev => !prev)
          break
        }
        case 'p':
        case 'P': {
          if (status === 'success') setStage('launch')
          break
        }
        case 's':
        case 'S': {
          setShowSystems(prev => !prev)
          break
        }
        case '?': {
          setShowShortcuts(prev => !prev)
          break
        }
        case 'Escape': {
          setHudTab(null)
          setShowShortcuts(false)
          setShowEditor(false)
          setShowSystems(false)
          break
        }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, template, status])

  // Close HUD when clicking outside
  const handleVoidClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-hud]') || (e.target as HTMLElement).closest('[data-topbar]')) return
    setHudTab(null)
  }, [])

  const wordCount = manuscript.split(/\s+/).filter(w => w.length > 0).length

  // ── Stage handlers ──

  function handlePortalAccept(text: string, portalTitle: string, detectedTemplate?: TemplateKey) {
    setManuscript(text)
    setTitle(portalTitle || 'My Manuscript')
    if (detectedTemplate) setTemplate(detectedTemplate)
    setStage('design')
  }

  function handleLoadSample(sampleKey: string) {
    const sample = SAMPLES.find(s => s.key === sampleKey) || SAMPLES[0]
    setManuscript(sample.md)
    setTitle(sample.title)
    setTemplate(sample.template)
    setStage('design')
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
      if (stage === 'portal') setStage('design')
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
    setStage('portal')
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

  function handleFontRemove() {
    setCustomFont(null)
  }

  // ── Mobile gate — editor is desktop-only ──
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  if (isMobile && !mobileGateDismissed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505] px-6">
        <div className="max-w-md text-center">
          <CompositorMark size={32} className="mx-auto mb-8 text-white/30" />
          <h1 className="font-display text-2xl font-bold text-white/90">
            Desktop Required
          </h1>
          <p className="mt-4 font-body text-sm leading-relaxed text-white/50">
            PagePerfect&rsquo;s editor requires a desktop browser for the full typesetting experience.
            Open this page on a laptop or tablet.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Link
              href="/"
              className="inline-flex h-10 items-center px-6 font-mono text-[11px] uppercase tracking-[0.1em] text-white/60 transition-colors hover:text-white"
            >
              Back to Home
            </Link>
            <button
              onClick={() => setMobileGateDismissed(true)}
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/25 transition-colors hover:text-white/50"
            >
              Continue anyway
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: The Layer Cake ──

  return (
    <>
      {/* Layer 0: The Void */}
      <VoidLayer gridVisible={stage === 'design'} />

      <AnimatePresence mode="wait">
        {/* Stage: Portal (ingest) */}
        {stage === 'portal' && (
          <motion.div key="portal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <PortalStage
              onAccept={handlePortalAccept}
              onLoadSample={handleLoadSample}
              onOpenManuscripts={handleOpenManuscripts}
              isLoggedIn={!!user}
              hasResumable={!!manuscript.trim()}
              onResume={() => setStage('design')}
              onPlatformSelect={setTargetPlatform}
            />
            {/* Manuscript browser (portal stage) */}
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
          </motion.div>
        )}

        {/* Stage: Design (the main workspace) */}
        {stage === 'design' && (
          <motion.div
            key="design"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 pt-[3.5rem]"
            onClick={handleVoidClick}
          >
            {/* Layer 1: The Levitating Book */}
            <PreviewPane
              pdfUrl={showEditor ? null : pdfUrl}
              loading={loading}
              status={status}
              errors={errors}
              isWatermarked={!hasTier(tier, 'publisher') && !!pdfUrl}
              quality={quality}
              onRetry={() => compile(false)}
            />

            {/* Layer 2: Top Bar */}
            <div data-topbar>
              <TopBar
                title={title}
                wordCount={wordCount}
                status={status}
                loading={loading}
                errors={errors}
                showEditor={showEditor}
                showSystems={showSystems}
                saving={manuscriptSaving}
                saveError={manuscriptSaveError}
                isLoggedIn={!!user}
                onTitleChange={setTitle}
                onBack={() => setStage('portal')}
                onPublish={() => setStage('launch')}
                onCompile={() => compile(false)}
                onToggleEditor={() => setShowEditor(prev => !prev)}
                onToggleSystems={() => setShowSystems(prev => !prev)}
                onShowManuscripts={handleOpenManuscripts}
              />
            </div>

            {/* Layer 2: Floating HUD dock */}
            <div data-hud>
              <FloatingHUD
                template={template}
                headingVariant={headingVariant}
                pageSize={pageSize}
                marginPreset={marginPreset}
                compileMode={compileMode}
                safeMode={safeMode}
                status={status}
                activeTab={hudTab}
                customFont={customFont}
                fontUploading={fontUploading}
                userTier={tier}
                onTabChange={setHudTab}
                onTemplateChange={setTemplate}
                onHeadingVariantChange={setHeadingVariant}
                onPageSizeChange={setPageSize}
                onMarginChange={setMarginPreset}
                onCompileModeChange={setCompileMode}
                onSafeModeChange={setSafeMode}
                onFontUpload={handleFontUpload}
                onFontRemove={handleFontRemove}
                quality={quality}
              />
            </div>

            {/* Keyboard shortcut hint */}
            <div className="fixed bottom-8 right-6 z-30">
              <button
                onClick={() => setShowShortcuts(prev => !prev)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#111111]/[0.06] text-[#111111]/30 transition-colors hover:bg-[#111111]/[0.10] hover:text-[#111111]/50"
              >
                <Keyboard className="h-3 w-3" />
              </button>
            </div>

            {/* Shortcut legend */}
            <ShortcutLegend visible={showShortcuts} onClose={() => setShowShortcuts(false)} />

            {/* Editor overlay */}
            <AnimatePresence>
              {showEditor && (
                <EditorOverlay
                  manuscript={manuscript}
                  onChange={setManuscript}
                  onClose={() => setShowEditor(false)}
                />
              )}
            </AnimatePresence>

            {/* Publishing Systems panel */}
            <AnimatePresence>
              {showSystems && (
                <PublishingSystems
                  manuscript={manuscript}
                  template={template}
                  pageSize={pageSize}
                  marginPreset={marginPreset}
                  visible={showSystems}
                  onClose={() => setShowSystems(false)}
                />
              )}
            </AnimatePresence>

            {/* Manuscript browser */}
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

            {/* Template nav hint — bottom left */}
            <div className="fixed bottom-10 left-6 z-30 hidden items-center gap-2 lg:flex">
              <button
                onClick={() => {
                  const idx = TEMPLATE_KEYS.indexOf(template)
                  setTemplate(TEMPLATE_KEYS[(idx - 1 + TEMPLATE_KEYS.length) % TEMPLATE_KEYS.length])
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#111111]/[0.06] text-[#111111]/30 transition-colors hover:bg-[#111111]/[0.10] hover:text-[#111111]/50"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <span className="font-mono text-[10px] text-[#111111]/35">
                {TEMPLATE_INFO[template].subtitle}
              </span>
              <button
                onClick={() => {
                  const idx = TEMPLATE_KEYS.indexOf(template)
                  setTemplate(TEMPLATE_KEYS[(idx + 1) % TEMPLATE_KEYS.length])
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#111111]/[0.06] text-[#111111]/30 transition-colors hover:bg-[#111111]/[0.10] hover:text-[#111111]/50"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage: Launch (export overlay) — renders on top of everything */}
      <AnimatePresence>
        {stage === 'launch' && (
          <LaunchOverlay
            title={title}
            template={template}
            headingVariant={headingVariant}
            pageSize={pageSize}
            marginPreset={marginPreset}
            wordCount={wordCount}
            manuscript={manuscript}
            safeMode={safeMode}
            compileMode={compileMode}
            pdfUrl={pdfUrl}
            customFont={customFont}
            onBack={() => setStage('design')}
            onDownload={handleDownload}
            lastDownloadWatermarked={lastDownloadWatermarked}
            userTier={tier}
            publisherWindowEnd={publisherWindowEnd}
            quality={quality}
            targetPlatform={targetPlatform}
          />
        )}
      </AnimatePresence>
    </>
  )
}
