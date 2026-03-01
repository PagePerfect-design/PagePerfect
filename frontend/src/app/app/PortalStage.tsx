'use client'
import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Check, ChevronRight } from 'lucide-react'

import { SAMPLES } from './sample'
import type { TemplateKey, Genre, Analysis, Platform } from './editor-types'
import { ease, TEMPLATE_INFO, GENRE_ORDER, GENRE_LABELS } from './editor-types'
import { cleanFromWord, analyzeManuscript, wordCategory } from './editor-utils'

const PLATFORM_OPTIONS: { key: Platform | 'generic'; label: string; detail: string }[] = [
  { key: 'kdp', label: 'Amazon KDP', detail: 'Spine, gutter, and trim validated for KDP' },
  { key: 'ingram', label: 'IngramSpark', detail: 'PDF/X-1a, CMYK, bleed compliance' },
  { key: 'generic', label: 'Other / Not sure', detail: 'Standard PDF — you can change later' },
]

export default function PortalStage({
  onAccept,
  onLoadSample,
  onOpenManuscripts,
  isLoggedIn,
  hasResumable,
  onResume,
  onPlatformSelect,
}: {
  onAccept: (text: string, title: string, detectedTemplate?: TemplateKey) => void
  onLoadSample: (sampleKey: string) => void
  onOpenManuscripts?: () => void
  isLoggedIn?: boolean
  hasResumable?: boolean
  onResume?: () => void
  onPlatformSelect?: (platform: Platform | null) => void
}) {
  const [dragActive, setDragActive] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'analyzing' | 'ready'>('idle')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [convertError, setConvertError] = useState<string | null>(null)
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'generic' | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey | null>(null)
  const [showAllTemplates, setShowAllTemplates] = useState(false)
  const pasteAreaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleText = useCallback((raw: string) => {
    const cleaned = cleanFromWord(raw)
    setText(cleaned)
    setPhase('analyzing')
    setTimeout(() => {
      setAnalysis(analyzeManuscript(cleaned))
      setPhase('ready')
    }, 800)
  }, [])

  const convertDocx = useCallback(async (file: File) => {
    setConvertError(null)
    setPhase('analyzing')
    try {
      const buf = await file.arrayBuffer()
      const resp = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buf,
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ message: 'Conversion failed.' }))
        setConvertError(err.message || 'Failed to convert .docx')
        setPhase('idle')
        return
      }
      const { markdown } = await resp.json()
      if (!markdown || typeof markdown !== 'string') {
        setConvertError('Conversion returned empty result.')
        setPhase('idle')
        return
      }
      handleText(markdown)
    } catch {
      setConvertError('Network error during .docx conversion.')
      setPhase('idle')
    }
  }, [handleText])

  const handleFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'docx') {
      convertDocx(file)
    } else {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result
        if (typeof result === 'string') handleText(result)
      }
      reader.readAsText(file)
    }
  }, [handleText, convertDocx])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  if (phase === 'idle') {
    return (
      <div
        className="fixed inset-0 z-20 flex items-center justify-center bg-[#FDFCF8]"
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={(e) => { if (e.currentTarget === e.target) setDragActive(false) }}
        onDrop={handleDrop}
      >
        <AnimatePresence>
          {dragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(255,51,51,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,51,51,0.08) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
          )}
        </AnimatePresence>

        <div className="relative z-10 w-full max-w-xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease }}
          >
            <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[0.9] tracking-tighter text-[#111111]">
              Drop your manuscript.
            </h1>
            <p className="mt-6 font-body text-lg text-[#111111]/60">
              .md, .txt, or .docx
            </p>
          </motion.div>

          <input
            id="manuscript-upload"
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,.markdown,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
            className="sr-only"
          />

          <AnimatePresence>
            {pasteMode && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.25 }}
                className="mt-8 w-full"
              >
                <textarea
                  id="manuscript-paste"
                  ref={pasteAreaRef}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  onPaste={(e) => {
                    const pasted = e.clipboardData?.getData('text/plain')
                    if (pasted) {
                      e.preventDefault()
                      setPasteText(pasted)
                    }
                  }}
                  placeholder="Paste or type your manuscript here..."
                  className="w-full h-48 resize-none border border-[#e5e5e0] bg-white px-4 py-3 font-mono text-sm text-[#111111]/80 placeholder:text-[#111111]/60 focus:border-[#FF3333]/40 focus:outline-none focus:ring-1 focus:ring-[#FF3333]/20"
                  autoFocus
                />
                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={() => { setPasteMode(false); setPasteText('') }}
                    className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#111111]/60 transition-colors hover:text-[#111111]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (pasteText.trim()) {
                        handleText(pasteText)
                        setPasteMode(false)
                      }
                    }}
                    disabled={!pasteText.trim()}
                    className="inline-flex h-9 items-center gap-2 bg-[#FF3333] px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-all hover:bg-[#E52222] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Continue
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* First-visit CTA — "See a finished book" */}
          {!pasteMode && !hasResumable && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-10"
            >
              <button
                onClick={() => onLoadSample('fiction')}
                className="group inline-flex h-11 items-center gap-3 bg-[#FF3333] px-8 font-mono text-[11px] uppercase tracking-[0.1em] text-white transition-all hover:bg-[#E52222]"
              >
                See a finished book
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
              <p className="mt-3 font-mono text-[10px] text-[#111111]/50">
                Loads a sample novel — KDP-ready in seconds
              </p>
            </motion.div>
          )}

          {!pasteMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-8 flex items-center justify-center gap-6"
            >
              <button
                onClick={() => { setPasteMode(true); setPasteText('') }}
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#111111]/60 transition-colors hover:text-[#111111]"
              >
                Paste text
              </button>
              <span className="text-[#111111]/60">|</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#111111]/60 transition-colors hover:text-[#111111]"
              >
                Browse files
              </button>
              <span className="text-[#111111]/60">|</span>
              {SAMPLES.map((s, i) => (
                <span key={s.key} className="inline-flex items-center gap-1">
                  {i > 0 && <span className="text-[#111111]/60">/</span>}
                  <button
                    onClick={() => onLoadSample(s.key)}
                    className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#111111]/60 transition-colors hover:text-[#111111]"
                  >
                    {s.label} sample
                  </button>
                </span>
              ))}
              {isLoggedIn && onOpenManuscripts && (
                <>
                  <span className="text-[#111111]/60">|</span>
                  <button
                    onClick={onOpenManuscripts}
                    className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#111111]/60 transition-colors hover:text-[#111111]"
                  >
                    My manuscripts
                  </button>
                </>
              )}
              {hasResumable && onResume && (
                <>
                  <span className="text-[#111111]/60">|</span>
                  <button
                    onClick={onResume}
                    className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#FF3333]/70 transition-colors hover:text-[#FF3333]"
                  >
                    Resume editing
                  </button>
                </>
              )}
            </motion.div>
          )}

          {convertError && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 mx-auto max-w-sm border border-red-500/20 bg-red-500/5 px-4 py-3 text-left"
            >
              <p className="font-mono text-[11px] text-red-600">{convertError}</p>
              <button
                onClick={() => setConvertError(null)}
                className="mt-1 font-mono text-[10px] text-[#111111]/50 hover:text-[#111111]"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 font-mono text-[10px] text-[#111111]/50"
          >
            Your text is stored only for your active session. Deleted on sign-out or within 24 hours.
          </motion.p>
        </div>
      </div>
    )
  }

  if (phase === 'analyzing') {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#FDFCF8]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease }}
          className="text-center"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-[#FF3333]/20"
              initial={{ width: 40, height: 40, opacity: 0.6 }}
              animate={{ width: 300 + i * 100, height: 300 + i * 100, opacity: 0 }}
              transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
            />
          ))}
          <div className="relative z-10">
            <div className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2 border-[#FF3333] border-t-transparent" />
            <p className="font-mono text-[12px] text-[#111111]/50">Analyzing manuscript...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  const detectedTemplate = analysis?.detected?.template ?? null
  const activeTemplate = selectedTemplate ?? detectedTemplate ?? 'paperback'
  const detectedGenre = analysis?.detected?.genre ?? 'fiction'

  // Build template list: detected genre first (with recommended), then others
  const genreTemplates = (g: Genre) =>
    (Object.entries(TEMPLATE_INFO) as [TemplateKey, typeof TEMPLATE_INFO[TemplateKey]][])
      .filter(([, info]) => info.genre === g)
      .map(([key]) => key)

  const primaryTemplates = genreTemplates(detectedGenre)
  const otherGenres = GENRE_ORDER.filter(g => g !== detectedGenre)

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#FDFCF8] px-6 overflow-y-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease }}
        className="w-full max-w-2xl my-auto"
      >
        <div className="border border-[#111111] bg-white">
          {/* Header — manuscript stats */}
          <div className="border-b border-[#e5e5e0] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center bg-[#FF3333]/10">
                <FileText className="h-4 w-4 text-[#FF3333]" />
              </div>
              <div>
                <p className="font-display text-base font-semibold text-[#111111]">Manuscript analyzed</p>
                <p className="font-mono text-[10px] text-[#111111]/60">{analysis && wordCategory(analysis.words)}</p>
              </div>
            </div>
          </div>

          {analysis && (
            <div className="grid grid-cols-2 gap-px bg-[#e5e5e0] sm:grid-cols-4">
              {[
                { label: 'Chapters', value: analysis.chapters || '—' },
                { label: 'Words', value: analysis.words.toLocaleString() },
                { label: 'Images', value: analysis.images || '—' },
                { label: 'Citations', value: analysis.hasReferences ? 'Found' : '—' },
              ].map((item) => (
                <div key={item.label} className="bg-white px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/60">{item.label}</p>
                  <p className="mt-1 font-display text-lg font-bold text-[#111111]">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Title */}
          <div className="border-t border-[#e5e5e0] px-6 py-5">
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-[#111111]/60">Working title</label>
            <input
              id="working-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Manuscript"
              autoFocus
              className="w-full border-b border-[#e5e5e0] bg-transparent pb-2 font-display text-xl font-bold text-[#111111] placeholder:text-[#111111]/60 focus:border-[#FF3333] focus:outline-none"
            />
          </div>

          {/* Template picker */}
          <div className="border-t border-[#e5e5e0] px-6 py-5">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-[#111111]/60">
              Choose a design
              {detectedTemplate && (
                <span className="ml-2 text-[#FF3333]/60">— recommended based on your manuscript</span>
              )}
            </p>

            {/* Primary genre templates */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {primaryTemplates.map((key) => {
                const info = TEMPLATE_INFO[key]
                const isRecommended = key === detectedTemplate
                const isActive = key === activeTemplate
                const isSerif = info.kind === 'serif'
                const isMono = info.kind === 'mono'
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedTemplate(key)}
                    className={`relative flex h-[88px] flex-col justify-between border p-3 text-left transition-all ${
                      isActive
                        ? 'border-[#FF3333] bg-[#FF3333]/[0.03]'
                        : 'border-[#e5e5e0] hover:border-[#111111]/40'
                    }`}
                  >
                    {isRecommended && (
                      <span className="absolute -top-2 right-2 bg-[#FF3333] px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-white">
                        Rec
                      </span>
                    )}
                    {/* Type specimen preview */}
                    <p className={`truncate text-[16px] leading-none ${isActive ? 'text-[#111111]' : 'text-[#111111]/50'} ${
                      isMono ? 'font-mono font-normal' : isSerif ? 'font-body font-semibold italic' : 'font-display font-bold tracking-tight'
                    }`}>
                      {info.specimen}
                    </p>
                    {/* Name + kind */}
                    <div>
                      <span className="block font-mono text-[10px] font-semibold text-[#111111]/70">{info.name}</span>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="font-mono text-[8px] text-[#111111]/40">{info.subtitle}</span>
                        <span className="font-mono text-[7px] uppercase tracking-[0.08em] text-[#111111]/25">{info.kind}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Show more templates */}
            {!showAllTemplates ? (
              <button
                onClick={() => setShowAllTemplates(true)}
                className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111]/60 transition-colors hover:text-[#111111]/70"
              >
                + Show all 15 templates
              </button>
            ) : (
              <div className="mt-4">
                {otherGenres.map((genre) => {
                  const templates = genreTemplates(genre)
                  if (!templates.length) return null
                  return (
                    <div key={genre} className="mt-3 first:mt-0">
                      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/50">
                        {GENRE_LABELS[genre]}
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {templates.map((key) => {
                          const info = TEMPLATE_INFO[key]
                          const isActive = key === activeTemplate
                          const isSerif = info.kind === 'serif'
                          const isMono = info.kind === 'mono'
                          return (
                            <button
                              key={key}
                              onClick={() => setSelectedTemplate(key)}
                              className={`flex h-[72px] flex-col justify-between border p-2.5 text-left transition-all ${
                                isActive
                                  ? 'border-[#FF3333] bg-[#FF3333]/[0.03]'
                                  : 'border-[#e5e5e0] hover:border-[#111111]/40'
                              }`}
                            >
                              <p className={`truncate text-[14px] leading-none ${isActive ? 'text-[#111111]' : 'text-[#111111]/50'} ${
                                isMono ? 'font-mono font-normal' : isSerif ? 'font-body font-semibold italic' : 'font-display font-bold tracking-tight'
                              }`}>
                                {info.specimen}
                              </p>
                              <div className="flex items-end justify-between gap-1">
                                <span className="truncate font-mono text-[9px] leading-none text-[#111111]/50">{info.name}</span>
                                <span className="shrink-0 font-mono text-[7px] uppercase leading-none tracking-[0.08em] text-[#111111]/25">{info.kind}</span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Active template detail bar */}
          <div className="flex items-start gap-3 border-t border-[#e5e5e0] px-6 py-3 bg-[#f5f5f0]">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF3333]" />
            <div>
              <p className="text-[12px] font-medium text-[#111111]/70">
                {TEMPLATE_INFO[activeTemplate].name} — {TEMPLATE_INFO[activeTemplate].vibe}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-[#111111]/60">
                Font: {TEMPLATE_INFO[activeTemplate].font} · You can change this anytime in the Style menu.
              </p>
            </div>
          </div>

          {/* Platform selection */}
          <div className="border-t border-[#e5e5e0] px-6 py-4">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[#111111]/60">
              Where will you publish?
            </p>
            <div className="flex gap-2">
              {PLATFORM_OPTIONS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    setSelectedPlatform(p.key)
                    onPlatformSelect?.(p.key === 'generic' ? null : p.key as Platform)
                  }}
                  className={`flex-1 border px-3 py-2.5 text-left transition-all ${
                    selectedPlatform === p.key
                      ? 'border-[#FF3333] bg-[#FF3333]/[0.04]'
                      : 'border-[#e5e5e0] hover:border-[#111111]/40'
                  }`}
                >
                  <span className={`block font-mono text-[11px] font-semibold ${
                    selectedPlatform === p.key ? 'text-[#FF3333]' : 'text-[#111111]/70'
                  }`}>
                    {p.label}
                  </span>
                  <span className="block font-mono text-[9px] text-[#111111]/60 mt-0.5">{p.detail}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#e5e5e0] px-6 py-4">
            <button
              onClick={() => { setText(''); setAnalysis(null); setPhase('idle'); setSelectedPlatform(null); setSelectedTemplate(null); setShowAllTemplates(false) }}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#111111]/60 transition-colors hover:text-[#111111]/70"
            >
              Start over
            </button>
            <button
              onClick={() => onAccept(text, title, activeTemplate)}
              className="group inline-flex h-11 items-center gap-3 bg-[#FF3333] px-7 font-display text-[14px] font-semibold text-white transition-all duration-200 hover:bg-[#E52222]"
            >
              Start designing
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
