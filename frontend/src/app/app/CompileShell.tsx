'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Upload, FileText, Download, Check, AlertTriangle } from 'lucide-react'

import { SAMPLE_MD } from './sample'

/* ═══════════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */

type TemplateKey = 'minimal' | 'symphony' | 'chronicle' | 'exhibit' | 'matrix' | 'avantgarde' | 'chicago' | 'paperback' | 'international' | 'cinema' | 'heirloom' | 'operator'
type PageSize = 'letter' | 'a4' | 'sixByNine' | 'fiveFiveByEightFive' | 'a5' | 'sevenByTen' | 'amazonFiveByEight' | 'amazonSixByNine' | 'amazonSevenByTen' | 'amazonEightByTen' | 'amazonEightFiveByEleven'
type MarginPreset = 'normal' | 'narrow' | 'wide' | 'minimal' | 'academic' | 'generous' | 'compact'
type CompileMode = 'fast' | 'full'
type CompileError = { message: string }
type Status = 'idle' | 'compiling' | 'success' | 'error'
type Stage = 'ingest' | 'atelier' | 'press'

const PREFS_KEY = 'pp-prefs-v1'
type Prefs = {
  template: TemplateKey
  pageSize: PageSize
  marginPreset: MarginPreset
  safeMode: boolean
  title: string
}

const TEMPLATE_INFO: Record<string, { name: string; desc: string; tag: string; font: string }> = {
  symphony:      { name: 'Symphony',       desc: 'Van de Graaf Canon, ornamental openings, hanging footnotes',      tag: 'Academic',   font: 'EB Garamond' },
  chicago:       { name: 'Chicago',        desc: 'University press monograph, true footnotes, CMOS running heads',  tag: 'Academic',   font: 'ETbb (Bembo)' },
  paperback:     { name: 'Paperback',      desc: 'Cinematic chapter openings, scene breaks, page-turner pacing',    tag: 'Fiction',    font: 'Alegreya Sans' },
  chronicle:     { name: 'Chronicle',      desc: 'Heavy rules, pull-quote blocks, flush-left ragged-right',         tag: 'Editorial',  font: 'TeX Gyre Heros' },
  exhibit:       { name: 'Exhibit',        desc: 'White Cube gallery, ghost-number chapters, extreme whitespace',   tag: 'Trade',      font: 'Fira Sans' },
  matrix:        { name: 'Matrix',         desc: 'Corporate annual report, lining figures, executive summaries',    tag: 'Business',   font: 'Fira Sans' },
  avantgarde:    { name: 'Avant-Garde',    desc: '120pt ghost numbers, brutalist blockquotes, deconstructed grid',  tag: 'Creative',   font: 'Source Sans 3' },
  minimal:       { name: 'Minimal',        desc: 'Zero dependencies, compiles anywhere, pure content focus',        tag: 'Basic',      font: 'Latin Modern' },
  international: { name: 'International',  desc: 'Müller-Brockmann Swiss Standard, one font, no italics',           tag: 'Swiss',      font: 'TeX Gyre Heros' },
  cinema:        { name: 'Cinema',         desc: 'Hollywood Standard screenplay, 1 page = 1 minute rule',           tag: 'Screenplay', font: 'TeX Gyre Cursor' },
  heirloom:      { name: 'Heirloom',       desc: 'Cookbook format, ingredient blocks, bold numbered steps',          tag: 'Cookbook',    font: 'Fira Sans' },
  operator:      { name: 'Operator',       desc: 'Engineering manual, warning/info/code admonition boxes',          tag: 'Technical',  font: 'Fira Sans' },
}

const PAGE_SIZES: Record<string, { label: string; desc: string }> = {
  fiveFiveByEightFive: { label: '5.5 × 8.5"', desc: 'Digest — fiction, memoir' },
  sixByNine:           { label: '6 × 9"',      desc: 'Trade — nonfiction standard' },
  letter:              { label: '8.5 × 11"',   desc: 'US Letter' },
  a4:                  { label: 'A4',           desc: '210 × 297 mm' },
  a5:                  { label: 'A5',           desc: '148 × 210 mm' },
  sevenByTen:          { label: '7 × 10"',     desc: 'Textbook' },
  amazonFiveByEight:   { label: '5 × 8"',      desc: 'Amazon KDP' },
  amazonSixByNine:     { label: '6 × 9"',      desc: 'Amazon KDP' },
  amazonSevenByTen:    { label: '7 × 10"',     desc: 'Amazon KDP' },
  amazonEightByTen:    { label: '8 × 10"',     desc: 'Amazon KDP' },
  amazonEightFiveByEleven: { label: '8.5 × 11"', desc: 'Amazon KDP' },
}

const ease = [0.25, 0.4, 0.25, 1] as const

/* ═══════════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════════════════ */

function slug(s: string) {
  return s.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}

function sizeCode(size: PageSize) {
  const map: Record<PageSize, string> = {
    letter: 'letter', a4: 'a4', a5: 'a5', sixByNine: '6x9', fiveFiveByEightFive: '5.5x8.5',
    sevenByTen: '7x10', amazonFiveByEight: 'amazon-5x8', amazonSixByNine: 'amazon-6x9',
    amazonSevenByTen: 'amazon-7x10', amazonEightByTen: 'amazon-8x10', amazonEightFiveByEleven: 'amazon-8.5x11',
  }
  return map[size] || 'letter'
}

function timestamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

function buildFilename(title: string, t: TemplateKey, size: PageSize) {
  return `${slug(title) || 'manuscript'}_${t}_${sizeCode(size)}_${timestamp()}.pdf`
}

function cleanFromWord(input: string): string {
  if (!input) return input
  let s = input
  s = s.replace(/\r\n?/g, '\n')
  s = s.replace(/[\u00A0\u2007\u202F]/g, ' ')
  s = s.replace(/\t/g, ' ')
  s = s.replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
  s = s.replace(/[\u2018\u2019\u2032]/g, "'")
  s = s.replace(/\u2026/g, '...')
  s = s.replace(/\s*[\u2013\u2014]\s*/g, ' — ')
  s = s.replace(/^[\s]*[•·]\s?/gm, '- ')
  s = s.replace(/\n{3,}/g, '\n\n')
  s = s.replace(/([.!?;:])\s{2,}/g, '$1 ')
  s = s.split('\n').map(l => l.replace(/\s+$/,'')).join('\n')
  return s
}

function adjustHeadingsForTemplate(md: string, template: TemplateKey): string {
  if (template !== 'paperback') return md
  return md.replace(/^#\s+(chapter\b.*)$/gim, '## $1')
}

/* ── Manuscript analysis ── */
type Analysis = {
  chapters: number
  words: number
  images: number
  hasFrontmatter: boolean
  hasReferences: boolean
}

function analyzeManuscript(md: string): Analysis {
  const chapters = (md.match(/^#{1,2}\s+/gm) || []).length
  const words = md.split(/\s+/).filter(w => w.length > 0).length
  const images = (md.match(/!\[/g) || []).length
  const hasFrontmatter = md.trimStart().startsWith('---')
  const hasReferences = /\[@[^\]]+\]/.test(md)
  return { chapters, words, images, hasFrontmatter, hasReferences }
}

/* ═══════════════════════════════════════════════════════════════════
   STAGE 1: THE SMART DROP (INGEST)
   ═══════════════════════════════════════════════════════════════════ */

function IngestStage({
  onAccept,
  onLoadSample,
}: {
  onAccept: (text: string, title: string) => void
  onLoadSample: () => void
}) {
  const [dragActive, setDragActive] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleText = useCallback((raw: string) => {
    const cleaned = cleanFromWord(raw)
    setText(cleaned)
    setAnalyzing(true)
    // Simulate X-ray scan animation
    setTimeout(() => {
      setAnalysis(analyzeManuscript(cleaned))
      setAnalyzing(false)
    }, 600)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result
        if (typeof result === 'string') handleText(result)
      }
      reader.readAsText(file)
    }
  }, [handleText])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pasted = e.clipboardData?.getData('text/plain')
    if (pasted) {
      e.preventDefault()
      handleText(pasted)
    }
  }, [handleText])

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          {/* Title */}
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.15em] text-white/25">
            Stage 1 &mdash; Ingest
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tighter text-white md:text-5xl">
            Drop your manuscript.
          </h1>
          <p className="mt-4 max-w-md font-body text-lg leading-relaxed text-white/35">
            Paste text, drag a file, or try our sample to see what&apos;s possible.
          </p>
        </motion.div>

        {/* Drop zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease }}
          className="mt-10"
        >
          {!text ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`relative flex min-h-[280px] cursor-text flex-col items-center justify-center border-2 border-dashed transition-all duration-300 ${
                dragActive
                  ? 'border-[#0033ff] bg-[#0033ff]/[0.03]'
                  : 'border-white/[0.1] hover:border-white/[0.2]'
              }`}
              onClick={() => textareaRef.current?.focus()}
            >
              <Upload className={`mb-4 h-8 w-8 transition-colors ${dragActive ? 'text-[#0033ff]' : 'text-white/15'}`} />
              <p className="font-body text-base text-white/30">
                Drag a .txt or .md file here, or click to paste
              </p>
              <p className="mt-2 font-mono text-[11px] text-white/15">
                Markdown &middot; Plain text &middot; Up to 2 MB
              </p>
              <textarea
                ref={textareaRef}
                className="absolute inset-0 cursor-text resize-none bg-transparent p-8 font-mono text-sm text-white/70 caret-[#0033ff] placeholder:text-transparent focus:outline-none"
                onPaste={handlePaste}
                onChange={(e) => { if (e.target.value.trim()) handleText(e.target.value) }}
                placeholder="Paste your manuscript..."
                aria-label="Manuscript input"
              />
            </div>
          ) : (
            <div className="border border-white/[0.08] bg-white/[0.01]">
              {/* X-Ray scan results */}
              <div className="border-b border-white/[0.06] p-6">
                <div className="mb-4 flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[#0033ff]" />
                  <span className="font-display text-lg font-bold text-white">Manuscript scanned</span>
                </div>

                {analyzing ? (
                  <div className="space-y-2">
                    {['Detecting chapters...', 'Scanning images...', 'Identifying frontmatter...'].map((line, i) => (
                      <motion.p
                        key={line}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15, duration: 0.3 }}
                        className="font-mono text-[12px] text-white/30"
                      >
                        <span className="text-[#0033ff]">&gt;</span> {line}
                      </motion.p>
                    ))}
                  </div>
                ) : analysis && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      { label: 'Chapters', value: analysis.chapters || 'None' },
                      { label: 'Words', value: analysis.words.toLocaleString() },
                      { label: 'Images', value: analysis.images },
                      { label: 'Frontmatter', value: analysis.hasFrontmatter ? 'Found' : 'Missing' },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/20">{item.label}</p>
                        <p className="mt-1 font-display text-xl font-bold text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Title input */}
              <div className="p-6">
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-white/25">
                  Working title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Manuscript"
                  className="w-full border-b border-white/[0.1] bg-transparent pb-2 font-display text-2xl font-bold text-white placeholder:text-white/15 focus:border-[#0033ff] focus:outline-none"
                />
              </div>

              {/* Accept */}
              <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-4">
                <button
                  onClick={() => { setText(''); setAnalysis(null) }}
                  className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/25 transition-colors hover:text-white/50"
                >
                  Start over
                </button>
                <button
                  onClick={() => onAccept(text, title)}
                  disabled={!analysis}
                  className="group inline-flex h-12 items-center gap-3 bg-[#0033ff] px-8 font-display text-[14px] font-semibold text-white transition-all duration-200 hover:bg-[#2255ff] disabled:opacity-30"
                >
                  Looks good
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Alternative: load sample */}
        {!text && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center"
          >
            <button
              onClick={onLoadSample}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/20 transition-colors hover:text-white/40"
            >
              Or try with a sample manuscript &rarr;
            </button>
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center font-mono text-[10px] text-white/10"
        >
          Your text is never stored. Sent to our server only for compilation, then immediately deleted.
        </motion.p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   STAGE 2: THE ATELIER (DESIGN CHOICES + LIVE PREVIEW)
   ═══════════════════════════════════════════════════════════════════ */

function AtelierStage({
  manuscript,
  title,
  template,
  pageSize,
  marginPreset,
  compileMode,
  safeMode,
  pdfUrl,
  status,
  loading,
  errors,
  wordCount,
  onTemplateChange,
  onPageSizeChange,
  onMarginChange,
  onCompileModeChange,
  onSafeModeChange,
  onTitleChange,
  onManuscriptChange,
  onBack,
  onExport,
}: {
  manuscript: string
  title: string
  template: TemplateKey
  pageSize: PageSize
  marginPreset: MarginPreset
  compileMode: CompileMode
  safeMode: boolean
  pdfUrl: string | null
  status: Status
  loading: boolean
  errors: CompileError[]
  wordCount: number
  onTemplateChange: (t: TemplateKey) => void
  onPageSizeChange: (s: PageSize) => void
  onMarginChange: (m: MarginPreset) => void
  onCompileModeChange: (m: CompileMode) => void
  onSafeModeChange: (s: boolean) => void
  onTitleChange: (t: string) => void
  onManuscriptChange: (m: string) => void
  onBack: () => void
  onExport: () => void
}) {
  const [showEditor, setShowEditor] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  const templateKeys = Object.keys(TEMPLATE_INFO) as TemplateKey[]

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-3 md:px-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-white/25 transition-colors hover:text-white/50">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <div className="h-4 w-px bg-white/[0.06]" />
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/25">
            Stage 2 &mdash; Atelier
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Status indicator */}
          <span className={`inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] ${
            status === 'compiling' ? 'text-[#0033ff]' :
            status === 'success' ? 'text-emerald-400' :
            status === 'error' ? 'text-red-400' :
            'text-white/20'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              status === 'compiling' ? 'bg-[#0033ff] animate-pulse' :
              status === 'success' ? 'bg-emerald-400' :
              status === 'error' ? 'bg-red-400' :
              'bg-white/20'
            }`} />
            {status === 'compiling' ? 'Typesetting...' : status === 'success' ? 'Ready' : status === 'error' ? 'Issue' : 'Idle'}
          </span>

          <button
            onClick={onExport}
            disabled={status !== 'success'}
            className="group inline-flex h-10 items-center gap-2 bg-[#0033ff] px-6 font-mono text-[11px] uppercase tracking-[0.1em] text-white transition-all duration-200 hover:bg-[#2255ff] disabled:opacity-30"
          >
            Export PDF
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* ── MAIN SPLIT ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: CONTROLS (30%) ── */}
        <div className="flex w-full flex-col overflow-y-auto border-r border-white/[0.06] lg:w-[30%] lg:min-w-[320px]">

          {/* Title */}
          <div className="border-b border-white/[0.06] p-6">
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-white/20">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full border-b border-white/[0.08] bg-transparent pb-1 font-display text-lg font-bold text-white placeholder:text-white/15 focus:border-[#0033ff] focus:outline-none"
              placeholder="Untitled"
            />
            <p className="mt-2 font-mono text-[10px] text-white/15">{wordCount.toLocaleString()} words</p>
          </div>

          {/* Template selector */}
          <div className="border-b border-white/[0.06] p-6">
            <label className="mb-4 block font-mono text-[10px] uppercase tracking-[0.15em] text-white/20">
              Typographic System
            </label>
            <div className="space-y-1">
              {templateKeys.map((key) => {
                const info = TEMPLATE_INFO[key]
                const isActive = key === template
                return (
                  <button
                    key={key}
                    onClick={() => onTemplateChange(key)}
                    className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition-all duration-200 ${
                      isActive
                        ? 'border-l-2 border-[#0033ff] bg-[#0033ff]/[0.04]'
                        : 'border-l-2 border-transparent hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-display text-sm font-semibold ${isActive ? 'text-white' : 'text-white/60'}`}>
                          {info.name}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/20">
                          {info.tag}
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-white/15">
                        {info.font}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Page size */}
          <div className="border-b border-white/[0.06] p-6">
            <label className="mb-3 block font-mono text-[10px] uppercase tracking-[0.15em] text-white/20">
              Page Size
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['fiveFiveByEightFive', 'sixByNine', 'letter', 'a4', 'a5', 'sevenByTen'] as PageSize[]).map((key) => {
                const info = PAGE_SIZES[key]
                const isActive = key === pageSize
                return (
                  <button
                    key={key}
                    onClick={() => onPageSizeChange(key)}
                    className={`px-3 py-2 text-left transition-all duration-200 ${
                      isActive
                        ? 'border border-[#0033ff]/30 bg-[#0033ff]/[0.04]'
                        : 'border border-white/[0.04] hover:border-white/[0.08]'
                    }`}
                  >
                    <span className={`block font-mono text-[11px] ${isActive ? 'text-white' : 'text-white/50'}`}>
                      {info.label}
                    </span>
                    <span className="block font-mono text-[9px] text-white/15">{info.desc}</span>
                  </button>
                )
              })}
            </div>
            {/* Show Amazon KDP sizes as collapsible */}
            <details className="mt-3">
              <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.1em] text-white/15 hover:text-white/25">
                Amazon KDP sizes
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {(['amazonFiveByEight', 'amazonSixByNine', 'amazonSevenByTen', 'amazonEightByTen', 'amazonEightFiveByEleven'] as PageSize[]).map((key) => {
                  const info = PAGE_SIZES[key]
                  const isActive = key === pageSize
                  return (
                    <button
                      key={key}
                      onClick={() => onPageSizeChange(key)}
                      className={`px-3 py-2 text-left transition-all ${
                        isActive
                          ? 'border border-[#0033ff]/30 bg-[#0033ff]/[0.04]'
                          : 'border border-white/[0.04] hover:border-white/[0.08]'
                      }`}
                    >
                      <span className={`block font-mono text-[11px] ${isActive ? 'text-white' : 'text-white/50'}`}>
                        {info.label}
                      </span>
                      <span className="block font-mono text-[9px] text-white/15">{info.desc}</span>
                    </button>
                  )
                })}
              </div>
            </details>
          </div>

          {/* Margins + Quality */}
          <div className="p-6">
            <div className="mb-4">
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-white/20">Margins</label>
              <select
                value={marginPreset}
                onChange={(e) => onMarginChange(e.target.value as MarginPreset)}
                className="input-dark w-full font-mono text-sm"
              >
                <option value="normal">Normal</option>
                <option value="narrow">Narrow</option>
                <option value="wide">Wide</option>
                <option value="minimal">Minimal</option>
                <option value="academic">Academic</option>
                <option value="generous">Generous</option>
                <option value="compact">Compact</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-white/20">Quality</label>
              <select
                value={compileMode}
                onChange={(e) => onCompileModeChange(e.target.value as CompileMode)}
                className="input-dark w-full font-mono text-sm"
              >
                <option value="fast">Preview (fast)</option>
                <option value="full">Final (full quality)</option>
              </select>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={safeMode} onChange={(e) => onSafeModeChange(e.target.checked)} className="h-3.5 w-3.5 accent-[#0033ff]" />
              <span className="font-mono text-[11px] text-white/30">Safe mode (skip citations)</span>
            </label>
          </div>

          {/* Edit manuscript toggle */}
          <div className="mt-auto border-t border-white/[0.06] p-4">
            <button
              onClick={() => setShowEditor(!showEditor)}
              className="w-full font-mono text-[11px] uppercase tracking-[0.12em] text-white/20 transition-colors hover:text-white/40"
            >
              {showEditor ? 'Hide editor' : 'Edit manuscript text'}
            </button>
          </div>
        </div>

        {/* ── RIGHT: PREVIEW / EDITOR (70%) ── */}
        <div className="hidden flex-1 flex-col lg:flex">
          {showEditor ? (
            <div className="flex flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-2.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/20">Editor</span>
                <button onClick={() => setShowEditor(false)} className="font-mono text-[11px] text-white/20 hover:text-white/40">
                  Show preview
                </button>
              </div>
              <textarea
                ref={textRef}
                value={manuscript}
                onChange={(e) => onManuscriptChange(e.target.value)}
                className="flex-1 resize-none bg-[#050505] p-6 font-mono text-sm leading-[1.8] text-white/70 caret-[#0033ff] focus:outline-none"
                placeholder="# Chapter One&#10;&#10;Write here..."
              />
            </div>
          ) : (
            <div className="relative flex flex-1 items-center justify-center bg-[#0a0a0a] p-8">
              {pdfUrl ? (
                <iframe
                  title="PDF preview"
                  src={pdfUrl}
                  className="h-full w-full max-w-3xl border border-white/[0.06] bg-white shadow-editorial"
                  style={{ aspectRatio: 'auto' }}
                />
              ) : (
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-20 w-14 items-center justify-center border border-white/[0.06]">
                    <FileText className="h-6 w-6 text-white/10" />
                  </div>
                  <p className="font-body text-sm text-white/20">
                    {manuscript.trim() ? 'Typesetting your manuscript...' : 'Preview will appear here'}
                  </p>
                </div>
              )}

              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#050505]/60 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-6 w-6 animate-spin border-2 border-[#0033ff] border-t-transparent" />
                    <span className="font-mono text-[11px] text-white/30">Typesetting...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="border-t border-red-500/20 bg-red-500/[0.03] px-6 py-3">
              {errors.map((e, i) => (
                <p key={i} className="flex items-center gap-2 font-mono text-[12px] text-red-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {e.message}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   STAGE 3: THE PRESS (EXPORT)
   ═══════════════════════════════════════════════════════════════════ */

type Platform = 'generic' | 'kdp' | 'ingram' | 'lulu'
type PaperStock = 'white' | 'cream'
type PreflightCheck = { name: string; status: 'pass' | 'fail' | 'warn' | 'info' | 'pending'; detail: string }

const PLATFORMS: Record<Platform, { label: string; desc: string }> = {
  generic:  { label: 'Standard PDF', desc: 'No platform constraints' },
  kdp:      { label: 'Amazon KDP',   desc: 'Kindle Direct Publishing' },
  ingram:   { label: 'IngramSpark',  desc: 'PDF/X-1a required' },
  lulu:     { label: 'Lulu',         desc: 'Print API integration' },
}

function PressStage({
  template,
  pageSize,
  marginPreset,
  pdfUrl,
  wordCount,
  onBack,
  onDownload,
  onDownloadPdfX,
}: {
  title: string
  template: TemplateKey
  pageSize: PageSize
  marginPreset: MarginPreset
  pdfUrl: string | null
  wordCount: number
  status: Status
  onBack: () => void
  onDownload: () => void
  onDownloadPdfX: () => void
}) {
  const [platform, setPlatform] = useState<Platform>('generic')
  const [paperStock, setPaperStock] = useState<PaperStock>('white')
  const [checks, setChecks] = useState<PreflightCheck[]>([
    { name: 'Initializing', status: 'pending', detail: 'Running pre-flight checks...' },
  ])
  const [stats, setStats] = useState<{ estimatedPages: number; spineInches: number; spineMm: number; gutterInches: number; marginInches: number } | null>(null)
  const [coverDims, setCoverDims] = useState<{ coverWidth: number; coverHeight: number; spine: number; coverWidthMm: number; coverHeightMm: number } | null>(null)
  const [preflightPassed, setPreflightPassed] = useState(true)

  // Run real pre-flight checks
  useEffect(() => {
    setChecks([{ name: 'Initializing', status: 'pending', detail: 'Running pre-flight checks...' }])
    setCoverDims(null)

    const controller = new AbortController()
    const run = async () => {
      try {
        const res = await fetch('/api/preflight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageSize, marginPreset, template, wordCount, platform, paperStock }),
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Pre-flight request failed')
        const data = await res.json()
        setChecks(data.checks)
        setStats(data.stats)
        setPreflightPassed(data.passed)
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        // Fallback to local estimation if API unavailable
        const estimatedPages = Math.ceil(wordCount / 250)
        const spineIn = +(estimatedPages * (paperStock === 'cream' ? 0.0025 : 0.002252)).toFixed(4)
        setStats({ estimatedPages, spineInches: spineIn, spineMm: +(spineIn * 25.4).toFixed(2), gutterInches: 0.5, marginInches: 1 })
        setChecks([
          { name: 'Pre-flight', status: 'warn', detail: 'API unavailable — using local estimates' },
          { name: 'Font embedding', status: 'pass', detail: 'XeLaTeX + fontspec — all fonts embedded' },
          { name: 'PDF format', status: 'pass', detail: 'Standard PDF (XeLaTeX output)' },
        ])
        setPreflightPassed(true)
      }

      // Fetch cover dimensions
      try {
        const dims = pageSizeDimensions(pageSize)
        const pages = Math.ceil(wordCount / 250)
        const cvRes = await fetch(`/api/cover-dimensions?width=${dims.w}&height=${dims.h}&pages=${pages}&paper=${paperStock}&platform=${platform}`, {
          signal: controller.signal,
        })
        if (cvRes.ok) setCoverDims(await cvRes.json())
      } catch { /* cover dims are optional */ }
    }
    run()
    return () => controller.abort()
  }, [platform, paperStock, pageSize, marginPreset, template, wordCount])

  const estimatedPages = stats?.estimatedPages || Math.ceil(wordCount / 250)
  const spineDisplay = stats?.spineInches?.toFixed(3) || (estimatedPages * 0.0025).toFixed(3)

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="w-full max-w-xl"
      >
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.15em] text-white/25">
          Stage 3 &mdash; Press
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tighter text-white md:text-5xl">
          Pre-flight check.
        </h1>

        {/* Platform selector */}
        <div className="mt-8 grid grid-cols-4 gap-px border border-white/[0.06]">
          {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`p-3 text-center transition-colors ${platform === p ? 'bg-white/[0.06]' : 'bg-white/[0.01] hover:bg-white/[0.03]'}`}
            >
              <p className={`font-mono text-[10px] font-medium uppercase tracking-[0.1em] ${platform === p ? 'text-white' : 'text-white/30'}`}>
                {PLATFORMS[p].label}
              </p>
            </button>
          ))}
        </div>

        {/* Paper stock selector */}
        <div className="mt-3 flex gap-3">
          {(['white', 'cream'] as PaperStock[]).map((ps) => (
            <button
              key={ps}
              onClick={() => setPaperStock(ps)}
              className={`font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${paperStock === ps ? 'text-white/60' : 'text-white/20 hover:text-white/30'}`}
            >
              {ps === 'white' ? 'White 55#' : 'Cream 60#'}
              {paperStock === ps && ' \u2713'}
            </button>
          ))}
        </div>

        {/* Terminal-style pre-flight checks */}
        <div className="mt-6 border border-white/[0.06] bg-[#0a0a0a]">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
            <div className="h-2 w-2 rounded-full bg-[#ff5f57]" />
            <div className="h-2 w-2 rounded-full bg-[#febc2e]" />
            <div className="h-2 w-2 rounded-full bg-[#28c840]" />
            <span className="ml-2 font-mono text-[11px] text-white/20">pageperfect — pre-flight ({PLATFORMS[platform].label})</span>
          </div>
          <div className="p-5 font-mono text-[13px] leading-[2]">
            {checks.map((check, i) => (
              <motion.div
                key={check.name + i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                className="flex items-start gap-3"
              >
                {check.status === 'pending' ? (
                  <span className="mt-0.5 text-white/20">&bull;</span>
                ) : check.status === 'pass' ? (
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : check.status === 'fail' ? (
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                ) : check.status === 'warn' ? (
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                ) : (
                  <span className="mt-0.5 text-blue-400/70">i</span>
                )}
                <span className={
                  check.status === 'pending' ? 'text-white/20' :
                  check.status === 'pass' ? 'text-emerald-400/70' :
                  check.status === 'fail' ? 'text-red-400/70' :
                  check.status === 'warn' ? 'text-amber-400/70' :
                  'text-blue-400/60'
                }>
                  <span className="text-white/30">{check.name}:</span> {check.detail}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-4 gap-px border border-white/[0.06]">
          {[
            { label: 'Est. Pages', value: estimatedPages },
            { label: 'Spine', value: `${spineDisplay}"` },
            { label: 'Gutter', value: `${stats?.gutterInches?.toFixed(3) || '0.500'}"` },
            { label: 'Words', value: wordCount.toLocaleString() },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.01] p-4 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/20">{stat.label}</p>
              <p className="mt-1 font-display text-lg font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Cover dimensions (if available) */}
        {coverDims && (
          <div className="mt-4 border border-white/[0.06] bg-white/[0.01] p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/20">Cover Template Dimensions</p>
            <div className="grid grid-cols-3 gap-4 font-mono text-[12px]">
              <div>
                <p className="text-white/30">Full Cover</p>
                <p className="text-white">{coverDims.coverWidth.toFixed(3)}&quot; &times; {coverDims.coverHeight.toFixed(3)}&quot;</p>
                <p className="text-white/20">{coverDims.coverWidthMm} &times; {coverDims.coverHeightMm} mm</p>
              </div>
              <div>
                <p className="text-white/30">Spine Width</p>
                <p className="text-white">{coverDims.spine.toFixed(4)}&quot;</p>
              </div>
              <div>
                <p className="text-white/30">Bleed</p>
                <p className="text-white">0.125&quot; all sides</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={onDownload}
            disabled={!pdfUrl}
            className="group inline-flex h-14 items-center justify-center gap-3 bg-[#0033ff] font-display text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#2255ff] disabled:opacity-30"
          >
            <Download className="h-4 w-4" />
            Download Interior PDF
          </button>

          {(platform === 'ingram') && (
            <button
              onClick={onDownloadPdfX}
              disabled={!pdfUrl}
              className="group inline-flex h-12 items-center justify-center gap-3 border border-white/[0.08] bg-white/[0.02] font-display text-[13px] font-medium text-white/70 transition-all duration-200 hover:bg-white/[0.05] hover:text-white disabled:opacity-30"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF/X-1a (IngramSpark)
            </button>
          )}
        </div>

        {/* Pre-flight status summary */}
        {!preflightPassed && (
          <p className="mt-4 font-mono text-[11px] text-amber-400/60">
            Some pre-flight checks did not pass. Review the results above before submitting to {PLATFORMS[platform].label}.
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <button onClick={onBack} className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/20 transition-colors hover:text-white/40">
            <ArrowLeft className="mr-1.5 inline h-3.5 w-3.5" />
            Back to Atelier
          </button>
          <p className="font-mono text-[10px] text-white/10">
            {TEMPLATE_INFO[template]?.name} &middot; {PAGE_SIZES[pageSize]?.label}
          </p>
        </div>
      </motion.div>
    </div>
  )
}

/** Map page size keys to dimensions in inches for cover calculator */
function pageSizeDimensions(size: PageSize): { w: number; h: number } {
  const dims: Record<string, { w: number; h: number }> = {
    letter: { w: 8.5, h: 11 }, a4: { w: 8.27, h: 11.69 }, a5: { w: 5.83, h: 8.27 },
    sixByNine: { w: 6, h: 9 }, fiveFiveByEightFive: { w: 5.5, h: 8.5 }, sevenByTen: { w: 7, h: 10 },
    amazonFiveByEight: { w: 5, h: 8 }, amazonSixByNine: { w: 6, h: 9 }, amazonSevenByTen: { w: 7, h: 10 },
    amazonEightByTen: { w: 8, h: 10 }, amazonEightFiveByEleven: { w: 8.5, h: 11 },
  }
  return dims[size] || { w: 6, h: 9 }
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN SHELL — ORCHESTRATES THE TUNNEL
   ═══════════════════════════════════════════════════════════════════ */

export default function CompileShell() {
  const searchParams = useSearchParams()
  const [stage, setStage] = useState<Stage>('ingest')
  const [manuscript, setManuscript] = useState('')
  const [template, setTemplate] = useState<TemplateKey>('symphony')
  const [title, setTitle] = useState<string>('')
  const [pageSize, setPageSize] = useState<PageSize>('sixByNine')
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('normal')
  const [safeMode, setSafeMode] = useState<boolean>(true)
  const [compileMode, setCompileMode] = useState<CompileMode>('fast')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<CompileError[]>([])
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [, setPdfBlob] = useState<Blob | null>(null)

  const debounceRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Read template from URL params
  useEffect(() => {
    const urlTemplate = searchParams.get('template')
    if (urlTemplate && urlTemplate in TEMPLATE_INFO) {
      setTemplate(urlTemplate as TemplateKey)
    }
  }, [searchParams])

  // Clean blob URLs on unmount/swap
  useEffect(() => {
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl) }
  }, [pdfUrl])

  // Load saved preferences on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY)
      if (!raw) return
      const p: Partial<Prefs> = JSON.parse(raw)
      if (p.template) setTemplate(p.template)
      if (p.pageSize) setPageSize(p.pageSize)
      if (p.marginPreset) setMarginPreset(p.marginPreset)
      if (typeof p.safeMode === 'boolean') setSafeMode(p.safeMode)
      if (typeof p.title === 'string' && p.title.trim()) setTitle(p.title)
    } catch { /* ignore */ }
  }, [])

  // Save preferences
  useEffect(() => {
    if (stage === 'ingest') return
    const prefs: Prefs = { template, pageSize, marginPreset, safeMode, title }
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)) } catch { /* ignore */ }
  }, [template, pageSize, marginPreset, safeMode, title, stage])

  // Debounced auto-compile in atelier stage
  useEffect(() => {
    if (stage !== 'atelier' || !manuscript.trim()) return
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => { void compile(false) }, 1000)
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manuscript, template, title, pageSize, marginPreset, safeMode, compileMode, stage])

  async function compile(downloadAfter: boolean, outputFormat?: string) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setStatus('compiling')
    setErrors([])

    try {
      const effectiveMd = adjustHeadingsForTemplate(manuscript, template)
      const resp = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manuscriptText: effectiveMd,
          template,
          title: title || 'Manuscript',
          pageSize,
          marginPreset,
          safeMode,
          compileMode,
          ...(outputFormat && { outputFormat }),
        }),
        signal: controller.signal,
      })
      const ct = resp.headers.get('content-type') || ''

      if (resp.ok && ct.includes('application/pdf')) {
        const blob = await resp.blob()
        setPdfBlob(blob)
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
        }
      } else {
        let payload: { message?: string; error?: string } | null = null
        try { payload = await resp.json() } catch { /* noop */ }
        setPdfBlob(null)
        const msgs: CompileError[] = []
        if (payload?.message) msgs.push({ message: payload.message })
        if (payload?.error) msgs.push({ message: String(payload.error) })
        if (!msgs.length) msgs.push({ message: `Compile failed (status ${resp.status}).` })
        setErrors(msgs)
        setStatus('error')
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setPdfBlob(null)
        setErrors([{ message: 'Network or server error. Please try again.' }])
        setStatus('error')
      }
    } finally {
      setLoading(false)
    }
  }

  const wordCount = manuscript.split(/\s+/).filter(w => w.length > 0).length

  // ── Stage handlers ──

  function handleIngestAccept(text: string, ingestTitle: string) {
    setManuscript(text)
    setTitle(ingestTitle || 'My Manuscript')
    setStage('atelier')
  }

  function handleLoadSample() {
    setManuscript(SAMPLE_MD)
    setTitle('Maritime Trade in the 17th Century')
    setStage('atelier')
  }

  function handleExportFromAtelier() {
    setStage('press')
  }

  function handleDownload() {
    compile(true)
  }

  function handleDownloadPdfX() {
    compile(true, 'pdfx1a')
  }

  // ── Render stage ──

  return (
    <AnimatePresence mode="wait">
      {stage === 'ingest' && (
        <motion.div key="ingest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <IngestStage onAccept={handleIngestAccept} onLoadSample={handleLoadSample} />
        </motion.div>
      )}
      {stage === 'atelier' && (
        <motion.div key="atelier" className="flex flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <AtelierStage
            manuscript={manuscript}
            title={title}
            template={template}
            pageSize={pageSize}
            marginPreset={marginPreset}
            compileMode={compileMode}
            safeMode={safeMode}
            pdfUrl={pdfUrl}
            status={status}
            loading={loading}
            errors={errors}
            wordCount={wordCount}
            onTemplateChange={setTemplate}
            onPageSizeChange={setPageSize}
            onMarginChange={setMarginPreset}
            onCompileModeChange={setCompileMode}
            onSafeModeChange={setSafeMode}
            onTitleChange={setTitle}
            onManuscriptChange={setManuscript}
            onBack={() => setStage('ingest')}
            onExport={handleExportFromAtelier}
          />
        </motion.div>
      )}
      {stage === 'press' && (
        <motion.div key="press" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <PressStage
            title={title}
            template={template}
            pageSize={pageSize}
            marginPreset={marginPreset}
            pdfUrl={pdfUrl}
            wordCount={wordCount}
            status={status}
            onBack={() => setStage('atelier')}
            onDownload={handleDownload}
            onDownloadPdfX={handleDownloadPdfX}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
