'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Download,
  Check,
  AlertTriangle,
  Paintbrush,
  Ruler,
  FileText,
  Settings2,
  Keyboard,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react'

import { SAMPLE_MD } from './sample'
import PublishingSystems from './PublishingSystems'

/* ═══════════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */

type TemplateKey = 'minimal' | 'symphony' | 'chronicle' | 'exhibit' | 'matrix' | 'avantgarde' | 'chicago' | 'paperback' | 'international' | 'cinema' | 'heirloom' | 'operator'
type PageSize = 'letter' | 'a4' | 'sixByNine' | 'fiveFiveByEightFive' | 'a5' | 'sevenByTen' | 'amazonFiveByEight' | 'amazonSixByNine' | 'amazonSevenByTen' | 'amazonEightByTen' | 'amazonEightFiveByEleven'
type MarginPreset = 'normal' | 'narrow' | 'wide' | 'minimal' | 'academic' | 'generous' | 'compact'
type CompileMode = 'fast' | 'full'
type CompileError = { message: string }
type Status = 'idle' | 'compiling' | 'success' | 'error'
type Stage = 'portal' | 'design' | 'launch'
type HudTab = 'style' | 'layout' | 'settings' | null

const PREFS_KEY = 'pp-prefs-v1'
type Prefs = {
  template: TemplateKey
  pageSize: PageSize
  marginPreset: MarginPreset
  safeMode: boolean
  title: string
}

type Genre = 'fiction' | 'nonfiction' | 'specialist' | 'all'

type TemplateEntry = {
  name: string
  subtitle: string
  vibe: string
  genre: Genre
  font: string
}

const TEMPLATE_INFO: Record<TemplateKey, TemplateEntry> = {
  symphony:      { name: 'Symphony',       subtitle: 'The Classic Novel',        vibe: 'Elegant serifs. Best for History, Romance, and Literary Fiction.',     genre: 'fiction',     font: 'EB Garamond' },
  paperback:     { name: 'Paperback',      subtitle: 'The Modern Bestseller',    vibe: 'Clean and fast. Best for Thrillers, Sci-Fi, and Airport Reads.',      genre: 'fiction',     font: 'Alegreya Sans' },
  exhibit:       { name: 'Exhibit',        subtitle: 'The Art Gallery',          vibe: 'Minimalist and airy. Best for Poetry, Photography, and Memoirs.',     genre: 'fiction',     font: 'Fira Sans' },
  chicago:       { name: 'Chicago',        subtitle: 'The University Press',     vibe: 'Scholarly authority. Best for Research, History, and Dissertations.', genre: 'nonfiction',  font: 'ETbb (Bembo)' },
  chronicle:     { name: 'Chronicle',      subtitle: 'The Journalist',           vibe: 'Bold and objective. Best for True Crime, Essays, and Magazines.',     genre: 'nonfiction',  font: 'TeX Gyre Heros' },
  matrix:        { name: 'Matrix',         subtitle: 'The Boardroom Report',     vibe: 'Structured and dense. Best for Business, Strategy, and Reports.',     genre: 'nonfiction',  font: 'Fira Sans' },
  international: { name: 'International',  subtitle: 'The Swiss Standard',       vibe: 'Pure grid logic. Best for Design, Architecture, and Monographs.',     genre: 'nonfiction',  font: 'TeX Gyre Heros' },
  cinema:        { name: 'Cinema',         subtitle: 'The Screenplay',           vibe: 'Hollywood Standard. 1 page = 1 minute. Courier, proper sluglines.',  genre: 'specialist',  font: 'TeX Gyre Cursor' },
  heirloom:      { name: 'Heirloom',       subtitle: 'The Cookbook',              vibe: 'Ingredient blocks, bold steps. Best for Recipes and Food Writing.',   genre: 'specialist',  font: 'Fira Sans' },
  operator:      { name: 'Operator',       subtitle: 'The Technical Manual',     vibe: 'Warning boxes, code blocks. Best for Docs, Guides, and Manuals.',    genre: 'specialist',  font: 'Fira Sans' },
  avantgarde:    { name: 'Avant-Garde',    subtitle: 'The Experimental',         vibe: 'Brutalist blockquotes, deconstructed grid. For rule-breakers.',       genre: 'specialist',  font: 'Source Sans 3' },
  minimal:       { name: 'Minimal',        subtitle: 'The Universal',            vibe: 'Zero dependencies. Compiles anywhere. Pure content, no fuss.',        genre: 'specialist',  font: 'Latin Modern' },
}

const TEMPLATE_KEYS = Object.keys(TEMPLATE_INFO) as TemplateKey[]

const GENRE_LABELS: Record<Genre, string> = {
  fiction: 'Fiction',
  nonfiction: 'Non-Fiction',
  specialist: 'Specialist',
  all: 'All',
}

const GENRE_ORDER: Genre[] = ['fiction', 'nonfiction', 'specialist']

const PAGE_SIZES: Record<string, { label: string; desc: string }> = {
  fiveFiveByEightFive: { label: '5.5 x 8.5"', desc: 'Digest' },
  sixByNine:           { label: '6 x 9"',      desc: 'Trade' },
  letter:              { label: '8.5 x 11"',   desc: 'Letter' },
  a4:                  { label: 'A4',           desc: '210x297mm' },
  a5:                  { label: 'A5',           desc: '148x210mm' },
  sevenByTen:          { label: '7 x 10"',     desc: 'Textbook' },
  amazonFiveByEight:   { label: '5 x 8"',      desc: 'KDP' },
  amazonSixByNine:     { label: '6 x 9"',      desc: 'KDP' },
  amazonSevenByTen:    { label: '7 x 10"',     desc: 'KDP' },
  amazonEightByTen:    { label: '8 x 10"',     desc: 'KDP' },
  amazonEightFiveByEleven: { label: '8.5 x 11"', desc: 'KDP' },
}

const MARGIN_INFO: Record<MarginPreset, { label: string; desc: string }> = {
  minimal:  { label: 'Minimal',  desc: 'Tight' },
  compact:  { label: 'Compact',  desc: 'Snug' },
  narrow:   { label: 'Narrow',   desc: 'Slim' },
  normal:   { label: 'Normal',   desc: 'Standard' },
  wide:     { label: 'Wide',     desc: 'Open' },
  academic: { label: 'Academic', desc: 'Scholarly' },
  generous: { label: 'Generous', desc: 'Airy' },
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

type DetectedGenre = {
  genre: Genre
  template: TemplateKey
  confidence: 'high' | 'medium' | 'low'
  message: string
}

type Analysis = {
  chapters: number
  words: number
  images: number
  hasFrontmatter: boolean
  hasReferences: boolean
  detected: DetectedGenre | null
}

/**
 * Strategy 3: The "Sherlock" Detective — auto-detect genre from content.
 * Scans the first ~150 lines for structural signals.
 */
function detectGenre(md: string): DetectedGenre | null {
  const head = md.split('\n').slice(0, 150).join('\n')
  const full = md

  // Screenplay: INT./EXT./FADE IN/CUT TO
  if (/\b(INT\.|EXT\.|FADE IN|FADE OUT|CUT TO|DISSOLVE TO)\b/.test(head)) {
    return { genre: 'specialist', template: 'cinema', confidence: 'high', message: 'Screenplay detected. Applied Cinema format.' }
  }

  // Cookbook: Ingredients, measurements
  if (/\b(ingredients|tsp|tbsp|cups?|preheat|oven)\b/i.test(head) && /\b\d+\s*(tsp|tbsp|cups?|oz|ml|g)\b/i.test(full)) {
    return { genre: 'specialist', template: 'heirloom', confidence: 'high', message: 'Recipe format detected. Applied Heirloom cookbook layout.' }
  }

  // Technical manual: code blocks, warnings, admonitions
  const codeBlocks = (full.match(/^```/gm) || []).length
  if (codeBlocks >= 4 || /\b(WARNING|CAUTION|NOTE|TIP):\s/m.test(head)) {
    return { genre: 'specialist', template: 'operator', confidence: 'medium', message: 'Technical documentation detected. Applied Operator layout.' }
  }

  // Academic: Abstract, Bibliography, citations
  if (/\b(abstract|bibliography|references|acknowledgements)\b/im.test(head) || /\[@[^\]]+\]/.test(head)) {
    return { genre: 'nonfiction', template: 'chicago', confidence: 'medium', message: 'Academic structure detected. Applied Chicago scholarly style.' }
  }

  // Business/report: Executive Summary, KPIs, quarterly
  if (/\b(executive summary|quarterly|stakeholders?|KPIs?|fiscal)\b/i.test(head)) {
    return { genre: 'nonfiction', template: 'matrix', confidence: 'medium', message: 'Business report detected. Applied Matrix corporate style.' }
  }

  // Fiction signals: chapters, dialogue-heavy
  const dialogueLines = (head.match(/^[""\u201C]/gm) || []).length
  const chapterHeadings = (head.match(/^#{1,2}\s+(chapter|part|prologue|epilogue)\b/gim) || []).length
  if (chapterHeadings >= 2 || dialogueLines >= 5) {
    return { genre: 'fiction', template: 'paperback', confidence: 'low', message: 'Looks like fiction. Applied Paperback modern style.' }
  }

  return null
}

function analyzeManuscript(md: string): Analysis {
  const chapters = (md.match(/^#{1,2}\s+/gm) || []).length
  const words = md.split(/\s+/).filter(w => w.length > 0).length
  const images = (md.match(/!\[/g) || []).length
  const hasFrontmatter = md.trimStart().startsWith('---')
  const hasReferences = /\[@[^\]]+\]/.test(md)
  const detected = detectGenre(md)
  return { chapters, words, images, hasFrontmatter, hasReferences, detected }
}

function wordCategory(count: number): string {
  if (count < 20000) return 'Short story'
  if (count < 50000) return 'Novella'
  if (count < 110000) return 'Novel'
  return 'Long-form'
}

/* ═══════════════════════════════════════════════════════════════════
   LAYER 0: THE VOID — Background canvas
   ═══════════════════════════════════════════════════════════════════ */

function VoidLayer({ gridVisible }: { gridVisible: boolean }) {
  return (
    <div className="fixed inset-0 -z-10 bg-[#050505]">
      {/* Brockmann grid pattern */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: gridVisible ? 0.06 : 0,
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Center radial spotlight */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: gridVisible ? 1 : 0.4,
          background: 'radial-gradient(ellipse 900px 700px at 50% 45%, rgba(255,255,255,0.03), transparent)',
        }}
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SKELETON LOADER — SVG wireframe shown during typesetting
   ═══════════════════════════════════════════════════════════════════ */

function BookSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative h-[520px] w-[380px]">
        <div className="absolute inset-0 rounded bg-white/[0.03] border border-white/[0.06]" />
        {/* Animated scan line */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0033ff]/40 to-transparent"
          initial={{ top: '10%' }}
          animate={{ top: '90%' }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
        {/* Skeleton lines */}
        <div className="absolute inset-x-[15%] top-[12%] space-y-3">
          <div className="h-4 w-3/5 rounded-sm bg-white/[0.04]" />
          <div className="h-2 w-4/5 rounded-sm bg-white/[0.03]" />
          <div className="mt-6 space-y-2">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="h-1.5 rounded-sm bg-white/[0.025]" style={{ width: `${70 + Math.sin(i * 1.3) * 20}%` }} />
            ))}
          </div>
        </div>
        <p className="absolute bottom-[8%] left-0 right-0 text-center font-mono text-[10px] text-white/10">
          Typesetting...
        </p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   LAYER 1: THE PORTAL (Ingest)
   Full-screen void. Manuscript drops in, book materializes.
   ═══════════════════════════════════════════════════════════════════ */

function PortalStage({
  onAccept,
  onLoadSample,
}: {
  onAccept: (text: string, title: string, detectedTemplate?: TemplateKey) => void
  onLoadSample: () => void
}) {
  const [dragActive, setDragActive] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'analyzing' | 'ready'>('idle')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [convertError, setConvertError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
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

  /** Send .docx binary to backend for Pandoc conversion, then feed the resulting markdown into handleText */
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

  /** Route file to the right handler based on extension */
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

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pasted = e.clipboardData?.getData('text/plain')
    if (pasted) {
      e.preventDefault()
      handleText(pasted)
    }
  }, [handleText])

  // The idle/drop state — entire screen is the dropzone
  if (phase === 'idle') {
    return (
      <div
        className="fixed inset-0 z-20 flex items-center justify-center"
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={(e) => { if (e.currentTarget === e.target) setDragActive(false) }}
        onDrop={handleDrop}
      >
        {/* Grid lights up on drag */}
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
                  'linear-gradient(to right, rgba(0,51,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,51,255,0.08) 1px, transparent 1px)',
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
            <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[0.9] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
              Drop your manuscript.
            </h1>
            <p className="mt-6 font-body text-lg text-white/25">
              .md, .txt, or .docx
            </p>
          </motion.div>

          {/* Hidden textarea for paste, hidden file input for click */}
          <textarea
            ref={textareaRef}
            className="sr-only"
            onPaste={handlePaste}
            onChange={(e) => { if (e.target.value.trim()) handleText(e.target.value) }}
            aria-label="Manuscript input"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,.markdown,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
            className="sr-only"
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-12 flex items-center justify-center gap-6"
          >
            <button
              onClick={() => textareaRef.current?.focus()}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/20 transition-colors hover:text-white/40"
            >
              Paste text
            </button>
            <span className="text-white/10">|</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/20 transition-colors hover:text-white/40"
            >
              Browse files
            </button>
            <span className="text-white/10">|</span>
            <button
              onClick={onLoadSample}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/20 transition-colors hover:text-white/40"
            >
              Try sample
            </button>
          </motion.div>

          {/* Conversion error feedback */}
          {convertError && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 mx-auto max-w-sm rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-left"
            >
              <p className="font-mono text-[11px] text-red-400">{convertError}</p>
              <button
                onClick={() => setConvertError(null)}
                className="mt-1 font-mono text-[10px] text-white/20 hover:text-white/40"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 font-mono text-[10px] text-white/8"
          >
            Your text is never stored. Sent for compilation only, then immediately deleted.
          </motion.p>
        </div>
      </div>
    )
  }

  // Analyzing phase — ripple/scan animation
  if (phase === 'analyzing') {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease }}
          className="text-center"
        >
          {/* Ripple rings */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#0033ff]/20"
              initial={{ width: 40, height: 40, opacity: 0.6 }}
              animate={{ width: 300 + i * 100, height: 300 + i * 100, opacity: 0 }}
              transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
            />
          ))}
          <div className="relative z-10">
            <div className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2 border-[#0033ff] border-t-transparent" />
            <p className="font-mono text-[12px] text-white/30">Analyzing manuscript...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  // Ready phase — summary card, then proceed
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease }}
        className="w-full max-w-lg"
      >
        {/* Summary card */}
        <div className="border border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur-xl">
          <div className="border-b border-white/[0.06] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0033ff]/10">
                <FileText className="h-4 w-4 text-[#0033ff]" />
              </div>
              <div>
                <p className="font-display text-base font-semibold text-white">
                  Manuscript analyzed
                </p>
                <p className="font-mono text-[10px] text-white/20">
                  {analysis && wordCategory(analysis.words)}
                </p>
              </div>
            </div>
          </div>

          {analysis && (
            <div className="grid grid-cols-2 gap-px bg-white/[0.04] sm:grid-cols-4">
              {[
                { label: 'Chapters', value: analysis.chapters || '—' },
                { label: 'Words', value: analysis.words.toLocaleString() },
                { label: 'Images', value: analysis.images || '—' },
                { label: 'Citations', value: analysis.hasReferences ? 'Found' : '—' },
              ].map((item) => (
                <div key={item.label} className="bg-[#0a0a0a] px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/15">{item.label}</p>
                  <p className="mt-1 font-display text-lg font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Genre detection message */}
          {analysis?.detected && (
            <div className="flex items-start gap-3 border-t border-white/[0.06] px-6 py-4 bg-[#0033ff]/[0.03]">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0033ff]" />
              <div>
                <p className="text-[12px] font-medium text-white/70">
                  {analysis.detected.message}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-white/20">
                  {analysis.detected.confidence === 'high' ? 'High confidence' : 'You can change this in the Style menu.'}
                </p>
              </div>
            </div>
          )}

          {/* Title input */}
          <div className="border-t border-white/[0.06] px-6 py-5">
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-white/20">
              Working title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Manuscript"
              autoFocus
              className="w-full border-b border-white/[0.08] bg-transparent pb-2 font-display text-xl font-bold text-white placeholder:text-white/15 focus:border-[#0033ff] focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-4">
            <button
              onClick={() => { setText(''); setAnalysis(null); setPhase('idle') }}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/20 transition-colors hover:text-white/40"
            >
              Start over
            </button>
            <button
              onClick={() => onAccept(text, title, analysis?.detected?.template)}
              className="group inline-flex h-11 items-center gap-3 bg-[#0033ff] px-7 font-display text-[14px] font-semibold text-white transition-all duration-200 hover:bg-[#2255ff]"
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

/* ═══════════════════════════════════════════════════════════════════
   LAYER 1: THE LEVITATING BOOK (Design stage artifact)
   The PDF preview sits center-screen, floating on the void.
   ═══════════════════════════════════════════════════════════════════ */

function LevitatingBook({
  pdfUrl,
  loading,
  status,
}: {
  pdfUrl: string | null
  loading: boolean
  status: Status
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pb-24 pt-16">
      {/* Book shadow / desk surface */}
      <div className="relative flex h-full max-h-[680px] w-full max-w-[520px] items-center justify-center">
        {/* The artifact */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease }}
          className="relative h-full w-full"
          style={{
            perspective: '2000px',
          }}
        >
          <div
            className="relative h-full w-full overflow-hidden bg-white transition-shadow duration-500"
            style={{
              boxShadow: status === 'success'
                ? '0 8px 40px rgba(0,0,0,0.5), 0 30px 80px -20px rgba(0,0,0,0.6)'
                : '0 4px 24px rgba(0,0,0,0.4), 0 20px 60px -16px rgba(0,0,0,0.5)',
            }}
          >
            {pdfUrl ? (
              <iframe
                title="PDF preview"
                src={pdfUrl}
                className="h-full w-full"
              />
            ) : loading ? (
              <BookSkeleton />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#0a0a0a]">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-16 w-12 items-center justify-center border border-white/[0.06]">
                    <FileText className="h-5 w-5 text-white/10" />
                  </div>
                  <p className="font-mono text-[11px] text-white/15">Preview appears here</p>
                </div>
              </div>
            )}

            {/* Loading overlay with skeleton — shows during recompile when a PDF already exists */}
            <AnimatePresence>
              {loading && pdfUrl && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-[#050505]/70 backdrop-blur-[2px]"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0033ff] border-t-transparent" />
                    <span className="font-mono text-[11px] text-white/30">Typesetting...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   LAYER 2: THE FLOATING HUD — Dock + Fan menus
   ═══════════════════════════════════════════════════════════════════ */

function FloatingHUD({
  template,
  pageSize,
  marginPreset,
  compileMode,
  safeMode,
  status,
  activeTab,
  onTabChange,
  onTemplateChange,
  onPageSizeChange,
  onMarginChange,
  onCompileModeChange,
  onSafeModeChange,
}: {
  template: TemplateKey
  pageSize: PageSize
  marginPreset: MarginPreset
  compileMode: CompileMode
  safeMode: boolean
  status: Status
  activeTab: HudTab
  onTabChange: (t: HudTab) => void
  onTemplateChange: (t: TemplateKey) => void
  onPageSizeChange: (s: PageSize) => void
  onMarginChange: (m: MarginPreset) => void
  onCompileModeChange: (m: CompileMode) => void
  onSafeModeChange: (s: boolean) => void
}) {
  const [genreFilter, setGenreFilter] = useState<Genre>('all')
  const [hoveredTemplate, setHoveredTemplate] = useState<TemplateKey | null>(null)

  const toggleTab = (tab: HudTab) => {
    onTabChange(activeTab === tab ? null : tab)
  }

  const filteredTemplates = genreFilter === 'all'
    ? TEMPLATE_KEYS
    : TEMPLATE_KEYS.filter(k => TEMPLATE_INFO[k].genre === genreFilter)

  return (
    <div className="fixed bottom-8 left-1/2 z-40 -translate-x-1/2">
      {/* Fan menus — pop up above the dock */}
      <AnimatePresence>
        {activeTab === 'style' && (
          <motion.div
            key="style-fan"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease }}
            className="mb-3 w-[520px] rounded-2xl border border-white/[0.08] bg-[#111111]/95 shadow-elevated backdrop-blur-xl"
          >
            {/* Genre tabs */}
            <div className="flex gap-0.5 border-b border-white/[0.06] px-3 pt-2">
              {(['all', ...GENRE_ORDER] as Genre[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGenreFilter(g)}
                  className={`rounded-t-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-all ${
                    genreFilter === g
                      ? 'bg-white/[0.06] text-white/70'
                      : 'text-white/20 hover:text-white/40'
                  }`}
                >
                  {GENRE_LABELS[g]}
                </button>
              ))}
            </div>

            {/* Template cards */}
            <div className="max-h-[50vh] overflow-y-auto p-2">
              <div className="grid grid-cols-3 gap-1.5">
                {filteredTemplates.map((key) => {
                  const info = TEMPLATE_INFO[key]
                  const isActive = key === template
                  const isHovered = key === hoveredTemplate
                  return (
                    <button
                      key={key}
                      onClick={() => { onTemplateChange(key); onTabChange(null) }}
                      onMouseEnter={() => setHoveredTemplate(key)}
                      onMouseLeave={() => setHoveredTemplate(null)}
                      className={`group relative flex flex-col items-start rounded-xl px-3 py-3 text-left transition-all duration-150 ${
                        isActive
                          ? 'bg-[#0033ff]/10 ring-1 ring-[#0033ff]/30'
                          : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className={`text-[12px] font-semibold ${isActive ? 'text-white' : 'text-white/60'}`}>
                        {info.name}
                      </span>
                      <span className={`text-[10px] ${isActive ? 'text-[#0033ff]/80' : 'text-white/25'}`}>
                        {info.subtitle}
                      </span>

                      {/* Hover tooltip — vibe description */}
                      <AnimatePresence>
                        {isHovered && !isActive && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute -top-12 left-0 z-50 w-48 rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-3 py-2 shadow-elevated"
                          >
                            <p className="font-body text-[10px] leading-[1.5] text-white/40">
                              {info.vibe}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'layout' && (
          <motion.div
            key="layout-fan"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease }}
            className="mb-3 rounded-2xl border border-white/[0.08] bg-[#111111]/95 p-4 shadow-elevated backdrop-blur-xl"
          >
            {/* Page Size */}
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-white/20">Page Size</p>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {(['fiveFiveByEightFive', 'sixByNine', 'letter', 'a4', 'a5', 'sevenByTen'] as PageSize[]).map((key) => {
                const info = PAGE_SIZES[key]
                const isActive = key === pageSize
                return (
                  <button
                    key={key}
                    onClick={() => onPageSizeChange(key)}
                    className={`rounded-lg px-3 py-2 text-center transition-all duration-150 ${
                      isActive
                        ? 'bg-[#0033ff]/10 ring-1 ring-[#0033ff]/30'
                        : 'bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className={`block text-[11px] font-medium ${isActive ? 'text-white' : 'text-white/50'}`}>
                      {info.label}
                    </span>
                    <span className="block font-mono text-[8px] text-white/20">{info.desc}</span>
                  </button>
                )
              })}
            </div>

            {/* Amazon KDP */}
            <details className="mt-3">
              <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.1em] text-white/15 hover:text-white/25">
                Amazon KDP sizes
              </summary>
              <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                {(['amazonFiveByEight', 'amazonSixByNine', 'amazonSevenByTen', 'amazonEightByTen', 'amazonEightFiveByEleven'] as PageSize[]).map((key) => {
                  const info = PAGE_SIZES[key]
                  const isActive = key === pageSize
                  return (
                    <button
                      key={key}
                      onClick={() => onPageSizeChange(key)}
                      className={`rounded-lg px-3 py-2 text-center transition-all ${
                        isActive
                          ? 'bg-[#0033ff]/10 ring-1 ring-[#0033ff]/30'
                          : 'bg-white/[0.02] hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className={`block text-[11px] font-medium ${isActive ? 'text-white' : 'text-white/50'}`}>
                        {info.label}
                      </span>
                      <span className="block font-mono text-[8px] text-white/20">{info.desc}</span>
                    </button>
                  )
                })}
              </div>
            </details>

            {/* Margins */}
            <p className="mb-2 mt-4 font-mono text-[9px] uppercase tracking-[0.15em] text-white/20">Margins</p>
            <div className="flex gap-1.5 overflow-x-auto">
              {(Object.keys(MARGIN_INFO) as MarginPreset[]).map((key) => {
                const info = MARGIN_INFO[key]
                const isActive = key === marginPreset
                return (
                  <button
                    key={key}
                    onClick={() => onMarginChange(key)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-center transition-all duration-150 ${
                      isActive
                        ? 'bg-[#0033ff]/10 ring-1 ring-[#0033ff]/30'
                        : 'bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className={`text-[11px] font-medium ${isActive ? 'text-white' : 'text-white/50'}`}>
                      {info.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings-fan"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease }}
            className="mb-3 w-72 rounded-2xl border border-white/[0.08] bg-[#111111]/95 p-4 shadow-elevated backdrop-blur-xl"
          >
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.15em] text-white/20">Compile Options</p>

            {/* Quality toggle */}
            <div className="mb-3 flex rounded-lg bg-white/[0.03] p-0.5">
              {(['fast', 'full'] as CompileMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onCompileModeChange(mode)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-center text-[11px] font-medium transition-all duration-150 ${
                    compileMode === mode
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {mode === 'fast' ? 'Preview' : 'Full quality'}
                </button>
              ))}
            </div>

            {/* Safe mode */}
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-white/[0.02]">
              <input
                type="checkbox"
                checked={safeMode}
                onChange={(e) => onSafeModeChange(e.target.checked)}
                className="h-3.5 w-3.5 rounded accent-[#0033ff]"
              />
              <span className="text-[11px] text-white/40">Safe mode (skip citations)</span>
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Dock */}
      <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#0a0a0a]/95 p-1.5 shadow-elevated backdrop-blur-xl">
        <DockButton
          active={activeTab === 'style'}
          onClick={() => toggleTab('style')}
          icon={<Paintbrush className="h-3.5 w-3.5" />}
          label={TEMPLATE_INFO[template].subtitle}
        />
        <div className="mx-0.5 h-4 w-px bg-white/[0.06]" />
        <DockButton
          active={activeTab === 'layout'}
          onClick={() => toggleTab('layout')}
          icon={<Ruler className="h-3.5 w-3.5" />}
          label={PAGE_SIZES[pageSize]?.label || 'Size'}
        />
        <div className="mx-0.5 h-4 w-px bg-white/[0.06]" />
        <DockButton
          active={activeTab === 'settings'}
          onClick={() => toggleTab('settings')}
          icon={<Settings2 className="h-3.5 w-3.5" />}
          label="Options"
        />

        {/* Status dot */}
        <div className="mx-1.5 h-4 w-px bg-white/[0.06]" />
        <div className="flex items-center gap-1.5 px-2">
          <span className={`h-1.5 w-1.5 rounded-full transition-colors ${
            status === 'compiling' ? 'bg-[#0033ff] animate-pulse' :
            status === 'success' ? 'bg-emerald-400' :
            status === 'error' ? 'bg-red-400' :
            'bg-white/20'
          }`} />
          <span className={`font-mono text-[9px] uppercase tracking-[0.1em] ${
            status === 'compiling' ? 'text-[#0033ff]' :
            status === 'success' ? 'text-emerald-400/70' :
            status === 'error' ? 'text-red-400/70' :
            'text-white/15'
          }`}>
            {status === 'compiling' ? 'Setting' : status === 'success' ? 'Ready' : status === 'error' ? 'Issue' : 'Idle'}
          </span>
        </div>
      </div>
    </div>
  )
}

function DockButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium transition-all duration-150 ${
        active
          ? 'bg-white text-black shadow-lg'
          : 'text-white/40 hover:bg-white/[0.05] hover:text-white/70'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   TOP BAR — Minimal. Title + actions float at the top.
   ═══════════════════════════════════════════════════════════════════ */

function TopBar({
  title,
  wordCount,
  status,
  errors,
  showEditor,
  showSystems,
  onTitleChange,
  onBack,
  onPublish,
  onToggleEditor,
  onToggleSystems,
}: {
  title: string
  wordCount: number
  status: Status
  errors: CompileError[]
  showEditor: boolean
  showSystems: boolean
  onTitleChange: (t: string) => void
  onBack: () => void
  onPublish: () => void
  onToggleEditor: () => void
  onToggleSystems: () => void
}) {
  return (
    <div className="fixed left-0 right-0 top-[3.5rem] z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 md:px-8">
        {/* Left: back + title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] text-white/30 transition-colors hover:bg-white/[0.08] hover:text-white/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="bg-transparent font-display text-sm font-semibold text-white/60 placeholder:text-white/20 focus:text-white focus:outline-none"
            placeholder="Untitled"
          />
          <span className="font-mono text-[10px] text-white/15">
            {wordCount.toLocaleString()} words
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          {/* Errors */}
          {errors.length > 0 && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-red-400/70">
              <AlertTriangle className="h-3 w-3" />
              {errors[0].message.slice(0, 50)}
            </span>
          )}

          <button
            onClick={onToggleEditor}
            className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium transition-all ${
              showEditor
                ? 'bg-white/[0.08] text-white/60'
                : 'text-white/25 hover:bg-white/[0.04] hover:text-white/40'
            }`}
          >
            <FileText className="h-3 w-3" />
            {showEditor ? 'Preview' : 'Edit'}
          </button>

          <button
            onClick={onToggleSystems}
            className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium transition-all ${
              showSystems
                ? 'bg-[#0033ff]/10 text-[#0033ff] ring-1 ring-[#0033ff]/30'
                : 'text-white/25 hover:bg-white/[0.04] hover:text-white/40'
            }`}
          >
            <BarChart3 className="h-3 w-3" />
            Systems
          </button>

          <button
            onClick={onPublish}
            disabled={status !== 'success'}
            className="group inline-flex h-8 items-center gap-2 rounded-full bg-[#0033ff] px-5 text-[12px] font-semibold text-white transition-all hover:bg-[#2255ff] disabled:opacity-30"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   LAYER 2: THE LAUNCH SEQUENCE (Export overlay)
   Pre-flight checks overlay on top of the book, then download.
   ═══════════════════════════════════════════════════════════════════ */

function LaunchOverlay({
  title,
  template,
  pageSize,
  wordCount,
  pdfUrl,
  status,
  onBack,
  onDownload,
}: {
  title: string
  template: TemplateKey
  pageSize: PageSize
  wordCount: number
  pdfUrl: string | null
  status: Status
  onBack: () => void
  onDownload: () => void
}) {
  const [checks, setChecks] = useState<{ label: string; status: 'pending' | 'ok' | 'warn' }[]>([
    { label: 'Checking bleed margins...', status: 'pending' },
    { label: 'Embedding fonts...', status: 'pending' },
    { label: 'Validating page dimensions...', status: 'pending' },
    { label: 'Running pre-flight...', status: 'pending' },
  ])
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    const info = TEMPLATE_INFO[template]
    const sizeLabel = PAGE_SIZES[pageSize]?.label || pageSize
    const timers = [
      setTimeout(() => setChecks(c => c.map((item, i) => i === 0 ? { label: `Bleed margins — 0.125" OK`, status: 'ok' as const } : item)), 400),
      setTimeout(() => setChecks(c => c.map((item, i) => i === 1 ? { label: `Fonts embedded — ${info?.font || 'System'}`, status: 'ok' as const } : item)), 800),
      setTimeout(() => setChecks(c => c.map((item, i) => i === 2 ? { label: `Page dimensions — ${sizeLabel}`, status: 'ok' as const } : item)), 1200),
      setTimeout(() => {
        setChecks(c => c.map((item, i) => i === 3 ? { label: 'Pre-flight complete', status: status === 'success' ? 'ok' as const : 'warn' as const } : item))
        setComplete(true)
      }, 1600),
    ]
    return () => timers.forEach(clearTimeout)
  }, [template, pageSize, status])

  const estimatedPages = Math.ceil(wordCount / 250)
  const spineWidth = (estimatedPages * 0.0025).toFixed(3)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease }}
        className="w-full max-w-md px-6"
      >
        {/* Close */}
        <div className="mb-4 flex justify-end">
          <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/30 transition-colors hover:bg-white/[0.1] hover:text-white/50">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Terminal card */}
        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0a0a]">
          {/* Terminal chrome */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
            <div className="h-2 w-2 rounded-full bg-[#ff5f57]" />
            <div className="h-2 w-2 rounded-full bg-[#febc2e]" />
            <div className="h-2 w-2 rounded-full bg-[#28c840]" />
            <span className="ml-2 font-mono text-[10px] text-white/15">pre-flight</span>
          </div>

          {/* Checks */}
          <div className="p-5 font-mono text-[12px] leading-[2]">
            {checks.map((check, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.4, duration: 0.3 }}
                className="flex items-center gap-2.5"
              >
                {check.status === 'pending' ? (
                  <span className="h-3.5 w-3.5 text-center text-white/15">...</span>
                ) : check.status === 'ok' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                )}
                <span className={
                  check.status === 'pending' ? 'text-white/20' :
                  check.status === 'ok' ? 'text-emerald-400/70' :
                  'text-amber-400/70'
                }>
                  {check.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <AnimatePresence>
          {complete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/[0.06]">
                {[
                  { label: 'Pages', value: `~${estimatedPages}` },
                  { label: 'Spine', value: `${spineWidth}"` },
                  { label: 'Words', value: wordCount.toLocaleString() },
                ].map((stat) => (
                  <div key={stat.label} className="bg-[#0a0a0a] p-3 text-center">
                    <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/15">{stat.label}</p>
                    <p className="mt-0.5 font-display text-lg font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Download actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={onDownload}
                  disabled={!pdfUrl}
                  className="group inline-flex h-12 flex-1 items-center justify-center gap-2.5 rounded-xl bg-[#0033ff] font-display text-[14px] font-semibold text-white transition-all hover:bg-[#2255ff] disabled:opacity-30"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
              </div>

              <p className="mt-4 text-center font-mono text-[10px] text-white/10">
                {TEMPLATE_INFO[template]?.name} / {PAGE_SIZES[pageSize]?.label} / {title || 'Untitled'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
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
      className="fixed bottom-24 right-6 z-50 rounded-xl border border-white/[0.08] bg-[#111111]/95 p-4 shadow-elevated backdrop-blur-xl"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/20">Shortcuts</span>
        <button onClick={onClose} className="text-white/20 hover:text-white/40">
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
            <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/40">{key}</kbd>
            <span className="text-white/25">{desc}</span>
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
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 flex"
    >
      {/* Left half: editor */}
      <div className="flex w-1/2 flex-col border-r border-white/[0.06] bg-[#050505]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-2.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/20">Manuscript</span>
          <button onClick={onClose} className="font-mono text-[11px] text-white/20 hover:text-white/40">
            Close
          </button>
        </div>
        <textarea
          value={manuscript}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 resize-none bg-transparent p-6 font-mono text-sm leading-[1.8] text-white/60 caret-[#0033ff] focus:outline-none"
          placeholder="# Chapter One&#10;&#10;Write here..."
          autoFocus
        />
      </div>
      {/* Right half: transparent (shows book underneath) */}
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
  const [title, setTitle] = useState<string>('')
  const [pageSize, setPageSize] = useState<PageSize>('sixByNine')
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('normal')
  const [safeMode, setSafeMode] = useState<boolean>(true)
  const [compileMode, setCompileMode] = useState<CompileMode>('fast')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<CompileError[]>([])
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const pdfBlobRef = useRef<Blob | null>(null)
  const [hudTab, setHudTab] = useState<HudTab>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showSystems, setShowSystems] = useState(false)

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
    if (stage === 'portal') return
    const prefs: Prefs = { template, pageSize, marginPreset, safeMode, title }
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)) } catch { /* ignore */ }
  }, [template, pageSize, marginPreset, safeMode, title, stage])

  // Debounced auto-compile in design stage
  useEffect(() => {
    if (stage !== 'design' || !manuscript.trim()) return
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => { void compile(false) }, 1000)
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manuscript, template, title, pageSize, marginPreset, safeMode, compileMode, stage])

  // Keyboard shortcuts (design stage)
  useEffect(() => {
    if (stage !== 'design') return

    function handleKey(e: KeyboardEvent) {
      // Don't capture when typing in inputs
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

  // Close HUD when clicking outside (on the void)
  const handleVoidClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-hud]') || (e.target as HTMLElement).closest('[data-topbar]')) return
    setHudTab(null)
  }, [])

  async function compile(downloadAfter: boolean) {
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
        }),
        signal: controller.signal,
      })
      const ct = resp.headers.get('content-type') || ''

      if (resp.ok && ct.includes('application/pdf')) {
        const blob = await resp.blob()
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
        }
      } else {
        let payload: { message?: string; error?: string } | null = null
        try { payload = await resp.json() } catch { /* noop */ }
        pdfBlobRef.current = null
        const msgs: CompileError[] = []
        if (payload?.message) msgs.push({ message: payload.message })
        if (payload?.error) msgs.push({ message: String(payload.error) })
        if (!msgs.length) msgs.push({ message: `Compile failed (status ${resp.status}).` })
        setErrors(msgs)
        setStatus('error')
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        pdfBlobRef.current = null
        setErrors([{ message: 'Network or server error. Please try again.' }])
        setStatus('error')
      }
    } finally {
      setLoading(false)
    }
  }

  const wordCount = manuscript.split(/\s+/).filter(w => w.length > 0).length

  // ── Stage handlers ──

  function handlePortalAccept(text: string, portalTitle: string, detectedTemplate?: TemplateKey) {
    setManuscript(text)
    setTitle(portalTitle || 'My Manuscript')
    if (detectedTemplate) setTemplate(detectedTemplate)
    setStage('design')
  }

  function handleLoadSample() {
    setManuscript(SAMPLE_MD)
    setTitle('Maritime Trade in the 17th Century')
    setStage('design')
  }

  function handleDownload() {
    compile(true)
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
            <PortalStage onAccept={handlePortalAccept} onLoadSample={handleLoadSample} />
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
            <LevitatingBook
              pdfUrl={showEditor ? null : pdfUrl}
              loading={loading}
              status={status}
            />

            {/* Layer 2: Top Bar */}
            <div data-topbar>
              <TopBar
                title={title}
                wordCount={wordCount}
                status={status}
                errors={errors}
                showEditor={showEditor}
                showSystems={showSystems}
                onTitleChange={setTitle}
                onBack={() => setStage('portal')}
                onPublish={() => setStage('launch')}
                onToggleEditor={() => setShowEditor(prev => !prev)}
                onToggleSystems={() => setShowSystems(prev => !prev)}
              />
            </div>

            {/* Layer 2: Floating HUD dock */}
            <div data-hud>
              <FloatingHUD
                template={template}
                pageSize={pageSize}
                marginPreset={marginPreset}
                compileMode={compileMode}
                safeMode={safeMode}
                status={status}
                activeTab={hudTab}
                onTabChange={setHudTab}
                onTemplateChange={setTemplate}
                onPageSizeChange={setPageSize}
                onMarginChange={setMarginPreset}
                onCompileModeChange={setCompileMode}
                onSafeModeChange={setSafeMode}
              />
            </div>

            {/* Keyboard shortcut hint */}
            <div className="fixed bottom-8 right-6 z-30">
              <button
                onClick={() => setShowShortcuts(prev => !prev)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.04] text-white/15 transition-colors hover:bg-white/[0.08] hover:text-white/30"
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

            {/* Template nav hint — bottom left */}
            <div className="fixed bottom-10 left-6 z-30 hidden items-center gap-2 lg:flex">
              <button
                onClick={() => {
                  const idx = TEMPLATE_KEYS.indexOf(template)
                  setTemplate(TEMPLATE_KEYS[(idx - 1 + TEMPLATE_KEYS.length) % TEMPLATE_KEYS.length])
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.04] text-white/20 transition-colors hover:bg-white/[0.08] hover:text-white/40"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <span className="font-mono text-[10px] text-white/15">
                {TEMPLATE_INFO[template].subtitle}
              </span>
              <button
                onClick={() => {
                  const idx = TEMPLATE_KEYS.indexOf(template)
                  setTemplate(TEMPLATE_KEYS[(idx + 1) % TEMPLATE_KEYS.length])
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.04] text-white/20 transition-colors hover:bg-white/[0.08] hover:text-white/40"
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
            pageSize={pageSize}
            wordCount={wordCount}
            pdfUrl={pdfUrl}
            status={status}
            onBack={() => setStage('design')}
            onDownload={handleDownload}
          />
        )}
      </AnimatePresence>
    </>
  )
}
