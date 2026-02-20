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
  Upload,
  Package,
  Loader2,
} from 'lucide-react'

import { SAMPLE_MD } from './sample'
import PublishingSystems from './PublishingSystems'
import { useAuth } from '@/lib/auth-context'
import { createClient, isPocketBaseConfigured } from '@/lib/supabase'

/* ═══════════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */

type TemplateKey = 'minimal' | 'symphony' | 'chronicle' | 'exhibit' | 'matrix' | 'avantgarde' | 'chicago' | 'paperback' | 'international' | 'cinema' | 'heirloom' | 'operator' | 'verse' | 'thesis' | 'memoir'
type HeadingVariant = 'classic' | 'modern' | 'bold'
type PageSize = 'letter' | 'a4' | 'sixByNine' | 'fiveFiveByEightFive' | 'a5' | 'sevenByTen' | 'royal' | 'bFormat' | 'massMarket' | 'aFormat' | 'demy' | 'fiveTwentyFiveByEight' | 'crownQuarto' | 'b5' | 'amazonFiveByEight' | 'amazonSixByNine' | 'amazonSevenByTen' | 'amazonEightByTen' | 'amazonEightFiveByEleven'
type MarginPreset = 'normal' | 'narrow' | 'wide' | 'minimal' | 'academic' | 'generous' | 'compact'
type CompileMode = 'fast' | 'full'
type CompileError = { message: string }
type Status = 'idle' | 'compiling' | 'success' | 'error'
type Stage = 'portal' | 'design' | 'launch'
type HudTab = 'style' | 'layout' | 'settings' | null
type Platform = 'kdp' | 'ingram'
type PaperStock = 'white' | 'cream'
type ExportFormat = 'pdf' | 'epub'
type CustomFont = { fontId: string; fontName: string; originalName: string } | null

type PreflightCheck = {
  name: string
  status: 'pass' | 'fail' | 'warn' | 'info'
  detail: string
}

type PreflightResult = {
  passed: boolean
  platform: string
  checks: PreflightCheck[]
  stats: {
    estimatedPages: number
    wordCount: number
    spineInches: number
    spineMm: number
    gutterInches: number
    trimWidth: number
    trimHeight: number
    marginInches: number
  }
}

const PREFS_KEY = 'pp-prefs-v1'
type Prefs = {
  template: TemplateKey
  pageSize: PageSize
  marginPreset: MarginPreset
  safeMode: boolean
  title: string
  headingVariant?: HeadingVariant
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
  // Fiction
  symphony:      { name: 'Symphony',       subtitle: 'The Classic Novel',        vibe: 'Elegant serifs. Best for History, Romance, and Literary Fiction.',     genre: 'fiction',     font: 'EB Garamond' },
  paperback:     { name: 'Paperback',      subtitle: 'The Modern Bestseller',    vibe: 'Clean and fast. Best for Thrillers, Sci-Fi, and Airport Reads.',      genre: 'fiction',     font: 'Alegreya Sans' },
  exhibit:       { name: 'Exhibit',        subtitle: 'The Art Gallery',          vibe: 'Minimalist and airy. Best for Poetry, Photography, and Memoirs.',     genre: 'fiction',     font: 'Fira Sans' },
  memoir:        { name: 'Memoir',         subtitle: 'The Personal Story',       vibe: 'Warm and intimate. Best for Memoir, Autobiography, and Travel.',      genre: 'fiction',     font: 'Libre Baskerville' },
  // Non-Fiction
  chicago:       { name: 'Chicago',        subtitle: 'The University Press',     vibe: 'Scholarly authority. Best for Research, History, and Dissertations.', genre: 'nonfiction',  font: 'ETbb (Bembo)' },
  thesis:        { name: 'Thesis',         subtitle: 'The Dissertation',         vibe: 'Double-spaced, numbered sections. University submission format.',     genre: 'nonfiction',  font: 'Latin Modern' },
  chronicle:     { name: 'Chronicle',      subtitle: 'The Journalist',           vibe: 'Bold and objective. Best for True Crime, Essays, and Magazines.',     genre: 'nonfiction',  font: 'TeX Gyre Heros' },
  matrix:        { name: 'Matrix',         subtitle: 'The Boardroom Report',     vibe: 'Structured and dense. Best for Business, Strategy, and Reports.',     genre: 'nonfiction',  font: 'Fira Sans' },
  international: { name: 'International',  subtitle: 'The Swiss Standard',       vibe: 'Pure grid logic. Best for Design, Architecture, and Monographs.',     genre: 'nonfiction',  font: 'TeX Gyre Heros' },
  // Specialist
  verse:         { name: 'Verse',          subtitle: 'The Poetry Collection',    vibe: 'Centered titles, generous leading. For Poetry and Verse Drama.',      genre: 'specialist',  font: 'EB Garamond' },
  cinema:        { name: 'Cinema',         subtitle: 'The Screenplay',           vibe: 'Hollywood Standard. 1 page = 1 minute. Courier, proper sluglines.',  genre: 'specialist',  font: 'TeX Gyre Cursor' },
  heirloom:      { name: 'Heirloom',       subtitle: 'The Cookbook',              vibe: 'Ingredient blocks, bold steps. Best for Recipes and Food Writing.',   genre: 'specialist',  font: 'Fira Sans' },
  operator:      { name: 'Operator',       subtitle: 'The Technical Manual',     vibe: 'Warning boxes, code blocks. Best for Docs, Guides, and Manuals.',    genre: 'specialist',  font: 'Fira Sans' },
  avantgarde:    { name: 'Avant-Garde',    subtitle: 'The Experimental',         vibe: 'Brutalist blockquotes, deconstructed grid. For rule-breakers.',       genre: 'specialist',  font: 'Source Sans 3' },
  minimal:       { name: 'Minimal',        subtitle: 'The Universal',            vibe: 'Zero dependencies. Compiles anywhere. Pure content, no fuss.',        genre: 'specialist',  font: 'Latin Modern' },
}

const HEADING_VARIANT_INFO: Record<HeadingVariant, { label: string; desc: string }> = {
  classic: { label: 'Classic', desc: 'Signature style' },
  modern:  { label: 'Modern',  desc: 'Clean & restrained' },
  bold:    { label: 'Bold',    desc: 'Dramatic & heavy' },
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
  royal:               { label: 'Royal',       desc: '156x234mm' },
  bFormat:             { label: 'B-format',    desc: '129x198mm' },
  massMarket:          { label: '4.25 x 6.87"', desc: 'Mass Market' },
  aFormat:             { label: 'A-format',    desc: '111x178mm' },
  demy:                { label: 'Demy',        desc: '138x216mm' },
  fiveTwentyFiveByEight: { label: '5.25 x 8"', desc: 'Fiction' },
  crownQuarto:         { label: 'Crown Quarto', desc: '189x246mm' },
  b5:                  { label: 'B5',          desc: '176x250mm' },
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
    sevenByTen: '7x10', royal: 'royal', bFormat: 'b-format',
    massMarket: 'mass-market', aFormat: 'a-format', demy: 'demy',
    fiveTwentyFiveByEight: '5.25x8', crownQuarto: 'crown-quarto', b5: 'b5',
    amazonFiveByEight: 'amazon-5x8', amazonSixByNine: 'amazon-6x9',
    amazonSevenByTen: 'amazon-7x10', amazonEightByTen: 'amazon-8x10', amazonEightFiveByEleven: 'amazon-8.5x11',
  }
  return map[size] || 'letter'
}

function timestamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

function buildFilename(title: string, t: TemplateKey, size: PageSize, ext = 'pdf') {
  return `${slug(title) || 'manuscript'}_${t}_${sizeCode(size)}_${timestamp()}.${ext}`
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
    <div className="fixed inset-0 -z-10 bg-[#FDFCF8]">
      {/* Brockmann grid pattern — dark hairlines on warm paper */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: gridVisible ? 0.06 : 0,
          backgroundImage:
            'linear-gradient(to right, #111111 1px, transparent 1px), linear-gradient(to bottom, #111111 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Center radial spotlight — warm */}
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
   SKELETON LOADER — SVG wireframe shown during typesetting
   ═══════════════════════════════════════════════════════════════════ */

function BookSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white">
      <div className="relative h-[520px] w-[380px]">
        <div className="absolute inset-0 rounded bg-[#111111]/[0.02] border border-[#111111]/[0.06]" />
        {/* Animated scan line */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF3333]/40 to-transparent"
          initial={{ top: '10%' }}
          animate={{ top: '90%' }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
        {/* Skeleton lines */}
        <div className="absolute inset-x-[15%] top-[12%] space-y-3">
          <div className="h-4 w-3/5 rounded-sm bg-[#111111]/[0.06]" />
          <div className="h-2 w-4/5 rounded-sm bg-[#111111]/[0.04]" />
          <div className="mt-6 space-y-2">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="h-1.5 rounded-sm bg-[#111111]/[0.04]" style={{ width: `${70 + Math.sin(i * 1.3) * 20}%` }} />
            ))}
          </div>
        </div>
        <p className="absolute bottom-[8%] left-0 right-0 text-center font-mono text-[10px] text-[#111111]/30">
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
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')
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
            <p className="mt-6 font-body text-lg text-[#111111]/40">
              .md, .txt, or .docx
            </p>
          </motion.div>

          {/* Hidden file input for browse */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,.markdown,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
            className="sr-only"
          />

          {/* Paste textarea panel — shown when Paste Text is clicked */}
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
                  className="w-full h-48 resize-none rounded-lg border border-[#111111]/10 bg-white px-4 py-3 font-mono text-sm text-[#111111]/80 placeholder:text-[#111111]/25 focus:border-[#FF3333]/40 focus:outline-none focus:ring-1 focus:ring-[#FF3333]/20"
                  autoFocus
                />
                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={() => { setPasteMode(false); setPasteText('') }}
                    className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#111111]/40 transition-colors hover:text-[#111111]/70"
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
                    className="inline-flex h-9 items-center gap-2 rounded-full bg-[#FF3333] px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-all hover:bg-[#E52222] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Continue
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons — hide when paste panel is open */}
          {!pasteMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-12 flex items-center justify-center gap-6"
            >
              <button
                onClick={() => { setPasteMode(true); setPasteText('') }}
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#111111]/40 transition-colors hover:text-[#111111]/70"
              >
                Paste text
              </button>
              <span className="text-[#111111]/15">|</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#111111]/40 transition-colors hover:text-[#111111]/70"
              >
                Browse files
              </button>
              <span className="text-[#111111]/15">|</span>
              <button
                onClick={onLoadSample}
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#111111]/40 transition-colors hover:text-[#111111]/70"
              >
                Try sample
              </button>
            </motion.div>
          )}

          {/* Conversion error feedback */}
          {convertError && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 mx-auto max-w-sm rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-left"
            >
              <p className="font-mono text-[11px] text-red-600">{convertError}</p>
              <button
                onClick={() => setConvertError(null)}
                className="mt-1 font-mono text-[10px] text-[#111111]/30 hover:text-[#111111]/60"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {/* Conversion error feedback */}
          {convertError && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 mx-auto max-w-sm rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-left"
            >
              <p className="font-mono text-[11px] text-red-600">{convertError}</p>
              <button
                onClick={() => setConvertError(null)}
                className="mt-1 font-mono text-[10px] text-[#111111]/30 hover:text-[#111111]/60"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 font-mono text-[10px] text-[#111111]/25"
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
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#FF3333]/20"
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
        <div className="border border-[#111111]/10 bg-white shadow-lg">
          <div className="border-b border-[#111111]/[0.06] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF3333]/10">
                <FileText className="h-4 w-4 text-[#FF3333]" />
              </div>
              <div>
                <p className="font-display text-base font-semibold text-[#111111]">
                  Manuscript analyzed
                </p>
                <p className="font-mono text-[10px] text-[#111111]/40">
                  {analysis && wordCategory(analysis.words)}
                </p>
              </div>
            </div>
          </div>

          {analysis && (
            <div className="grid grid-cols-2 gap-px bg-[#111111]/[0.04] sm:grid-cols-4">
              {[
                { label: 'Chapters', value: analysis.chapters || '—' },
                { label: 'Words', value: analysis.words.toLocaleString() },
                { label: 'Images', value: analysis.images || '—' },
                { label: 'Citations', value: analysis.hasReferences ? 'Found' : '—' },
              ].map((item) => (
                <div key={item.label} className="bg-white px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/40">{item.label}</p>
                  <p className="mt-1 font-display text-lg font-bold text-[#111111]">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Genre detection message */}
          {analysis?.detected && (
            <div className="flex items-start gap-3 border-t border-[#111111]/[0.06] px-6 py-4 bg-[#FF3333]/[0.03]">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF3333]" />
              <div>
                <p className="text-[12px] font-medium text-[#111111]/70">
                  {analysis.detected.message}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-[#111111]/40">
                  {analysis.detected.confidence === 'high' ? 'High confidence' : 'You can change this in the Style menu.'}
                </p>
              </div>
            </div>
          )}

          {/* Title input */}
          <div className="border-t border-[#111111]/[0.06] px-6 py-5">
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-[#111111]/40">
              Working title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Manuscript"
              autoFocus
              className="w-full border-b border-[#111111]/[0.08] bg-transparent pb-2 font-display text-xl font-bold text-[#111111] placeholder:text-[#111111]/25 focus:border-[#FF3333] focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-[#111111]/[0.06] px-6 py-4">
            <button
              onClick={() => { setText(''); setAnalysis(null); setPhase('idle') }}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#111111]/40 transition-colors hover:text-[#111111]/70"
            >
              Start over
            </button>
            <button
              onClick={() => onAccept(text, title, analysis?.detected?.template)}
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

/* ═══════════════════════════════════════════════════════════════════
   LAYER 1: THE LEVITATING BOOK (Design stage artifact)
   The PDF preview sits center-screen, floating on the void.
   ═══════════════════════════════════════════════════════════════════ */

function LevitatingBook({
  pdfUrl,
  loading,
  status,
  errors,
}: {
  pdfUrl: string | null
  loading: boolean
  status: Status
  errors: CompileError[]
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
                ? '0 2px 8px rgba(0,0,0,0.08), 0 12px 40px -8px rgba(0,0,0,0.12)'
                : '0 1px 4px rgba(0,0,0,0.06), 0 8px 30px -6px rgba(0,0,0,0.10)',
              border: '1px solid rgba(17,17,17,0.08)',
            }}
          >
            {pdfUrl ? (
              <iframe
                title="PDF preview"
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                className="h-full w-full"
              />
            ) : loading ? (
              <BookSkeleton />
            ) : status === 'error' && errors.length > 0 ? (
              <div className="flex h-full w-full items-center justify-center bg-[#F8F7F3] p-8">
                <div className="max-w-[360px] text-center">
                  <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-red-500/20 bg-red-500/5">
                    <AlertTriangle className="h-4 w-4 text-red-500/60" />
                  </div>
                  <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-wider text-red-600/70">Typesetting Error</p>
                  {errors.map((e, i) => (
                    <p key={i} className="mb-1.5 font-mono text-[10px] leading-relaxed text-[#111111]/40">{e.message}</p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#F8F7F3]">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-16 w-12 items-center justify-center border border-[#111111]/[0.08]">
                    <FileText className="h-5 w-5 text-[#111111]/20" />
                  </div>
                  <p className="font-mono text-[11px] text-[#111111]/30">Preview appears here</p>
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
                  className="absolute inset-0 z-10 flex items-center justify-center bg-[#FDFCF8]/70 backdrop-blur-[2px]"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#FF3333] border-t-transparent" />
                    <span className="font-mono text-[11px] text-[#111111]/40">Typesetting...</span>
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
  headingVariant,
  pageSize,
  marginPreset,
  compileMode,
  safeMode,
  status,
  activeTab,
  customFont,
  fontUploading,
  onTabChange,
  onTemplateChange,
  onHeadingVariantChange,
  onPageSizeChange,
  onMarginChange,
  onCompileModeChange,
  onSafeModeChange,
  onFontUpload,
  onFontRemove,
}: {
  template: TemplateKey
  headingVariant: HeadingVariant
  pageSize: PageSize
  marginPreset: MarginPreset
  compileMode: CompileMode
  safeMode: boolean
  status: Status
  activeTab: HudTab
  customFont: CustomFont
  fontUploading: boolean
  onTabChange: (t: HudTab) => void
  onTemplateChange: (t: TemplateKey) => void
  onHeadingVariantChange: (v: HeadingVariant) => void
  onPageSizeChange: (s: PageSize) => void
  onMarginChange: (m: MarginPreset) => void
  onCompileModeChange: (m: CompileMode) => void
  onSafeModeChange: (s: boolean) => void
  onFontUpload: (file: File) => void
  onFontRemove: () => void
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
            className="mb-3 w-[520px] rounded-2xl border border-[#111111]/10 bg-white shadow-elevated backdrop-blur-xl"
          >
            {/* Genre tabs */}
            <div className="flex gap-0.5 border-b border-[#111111]/[0.06] px-3 pt-2">
              {(['all', ...GENRE_ORDER] as Genre[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGenreFilter(g)}
                  className={`rounded-t-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-all ${
                    genreFilter === g
                      ? 'bg-[#111111]/[0.06] text-[#111111]/70'
                      : 'text-[#111111]/25 hover:text-[#111111]/50'
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
                          ? 'bg-[#FF3333]/10 ring-1 ring-[#FF3333]/30'
                          : 'hover:bg-[#111111]/[0.04]'
                      }`}
                    >
                      <span className={`text-[12px] font-semibold ${isActive ? 'text-[#111111]' : 'text-[#111111]/60'}`}>
                        {info.name}
                      </span>
                      <span className={`text-[10px] ${isActive ? 'text-[#FF3333]/80' : 'text-[#111111]/30'}`}>
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
                            className="absolute -top-12 left-0 z-50 w-48 rounded-lg border border-[#111111]/10 bg-white px-3 py-2 shadow-elevated"
                          >
                            <p className="font-body text-[10px] leading-[1.5] text-[#111111]/50">
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

            {/* Heading variant toggle — secondary choice */}
            <div className="flex items-center justify-between border-t border-[#111111]/[0.06] px-4 py-2.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111]/30">Headings</span>
              <div className="flex gap-1">
                {(['classic', 'modern', 'bold'] as HeadingVariant[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => onHeadingVariantChange(v)}
                    className={`rounded-full px-3 py-1 font-mono text-[10px] transition-all ${
                      headingVariant === v
                        ? 'bg-[#111111] text-white'
                        : 'text-[#111111]/35 hover:bg-[#111111]/[0.05] hover:text-[#111111]/60'
                    }`}
                  >
                    {HEADING_VARIANT_INFO[v].label}
                  </button>
                ))}
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
            className="mb-3 rounded-2xl border border-[#111111]/10 bg-white p-4 shadow-elevated backdrop-blur-xl"
          >
            {/* Page Size */}
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">Page Size</p>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {(['fiveFiveByEightFive', 'sixByNine', 'a5', 'royal', 'letter', 'a4'] as PageSize[]).map((key) => {
                const info = PAGE_SIZES[key]
                const isActive = key === pageSize
                return (
                  <button
                    key={key}
                    onClick={() => onPageSizeChange(key)}
                    className={`rounded-lg px-3 py-2 text-center transition-all duration-150 ${
                      isActive
                        ? 'bg-[#FF3333]/10 ring-1 ring-[#FF3333]/30'
                        : 'bg-[#111111]/[0.02] hover:bg-[#111111]/[0.05]'
                    }`}
                  >
                    <span className={`block text-[11px] font-medium ${isActive ? 'text-[#111111]' : 'text-[#111111]/50'}`}>
                      {info.label}
                    </span>
                    <span className="block font-mono text-[8px] text-[#111111]/25">{info.desc}</span>
                  </button>
                )
              })}
            </div>

            {/* More book sizes */}
            <details className="mt-3">
              <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.1em] text-[#111111]/35 hover:text-[#111111]/55">
                More book sizes
              </summary>
              <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                {(['massMarket', 'aFormat', 'bFormat', 'fiveTwentyFiveByEight', 'demy', 'sevenByTen', 'b5', 'crownQuarto'] as PageSize[]).map((key) => {
                  const info = PAGE_SIZES[key]
                  const isActive = key === pageSize
                  return (
                    <button
                      key={key}
                      onClick={() => onPageSizeChange(key)}
                      className={`rounded-lg px-3 py-2 text-center transition-all duration-150 ${
                        isActive
                          ? 'bg-[#FF3333]/10 ring-1 ring-[#FF3333]/30'
                          : 'bg-[#111111]/[0.02] hover:bg-[#111111]/[0.05]'
                      }`}
                    >
                      <span className={`block text-[11px] font-medium ${isActive ? 'text-[#111111]' : 'text-[#111111]/50'}`}>
                        {info.label}
                      </span>
                      <span className="block font-mono text-[8px] text-[#111111]/25">{info.desc}</span>
                    </button>
                  )
                })}
              </div>
            </details>

            {/* Amazon KDP */}
            <details className="mt-3">
              <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.1em] text-[#111111]/35 hover:text-[#111111]/55">
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
                          ? 'bg-[#FF3333]/10 ring-1 ring-[#FF3333]/30'
                          : 'bg-[#111111]/[0.02] hover:bg-[#111111]/[0.05]'
                      }`}
                    >
                      <span className={`block text-[11px] font-medium ${isActive ? 'text-[#111111]' : 'text-[#111111]/50'}`}>
                        {info.label}
                      </span>
                      <span className="block font-mono text-[8px] text-[#111111]/25">{info.desc}</span>
                    </button>
                  )
                })}
              </div>
            </details>

            {/* Margins */}
            <p className="mb-2 mt-4 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">Margins</p>
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
                        ? 'bg-[#FF3333]/10 ring-1 ring-[#FF3333]/30'
                        : 'bg-[#111111]/[0.02] hover:bg-[#111111]/[0.05]'
                    }`}
                  >
                    <span className={`text-[11px] font-medium ${isActive ? 'text-[#111111]' : 'text-[#111111]/50'}`}>
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
            className="mb-3 w-72 rounded-2xl border border-[#111111]/10 bg-white p-4 shadow-elevated backdrop-blur-xl"
          >
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">Compile Options</p>

            {/* Quality toggle */}
            <div className="mb-3 flex rounded-lg bg-[#111111]/[0.03] p-0.5">
              {(['fast', 'full'] as CompileMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onCompileModeChange(mode)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-center text-[11px] font-medium transition-all duration-150 ${
                    compileMode === mode
                      ? 'bg-[#111111]/[0.08] text-[#111111]'
                      : 'text-[#111111]/40 hover:text-[#111111]/60'
                  }`}
                >
                  {mode === 'fast' ? 'Preview' : 'Full quality'}
                </button>
              ))}
            </div>

            {/* Safe mode */}
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-[#111111]/[0.02]">
              <input
                type="checkbox"
                checked={safeMode}
                onChange={(e) => onSafeModeChange(e.target.checked)}
                className="h-3.5 w-3.5 rounded accent-[#FF3333]"
              />
              <span className="text-[11px] text-[#111111]/50">Safe mode (skip citations)</span>
            </label>

            {/* Custom font upload */}
            <div className="mt-3 border-t border-[#111111]/[0.06] pt-3">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">Custom Font</p>
              {customFont ? (
                <div className="flex items-center gap-2 rounded-lg bg-[#111111]/[0.03] px-3 py-2">
                  <span className="flex-1 truncate text-[11px] text-[#111111]/50">{customFont.originalName}</span>
                  <button
                    onClick={onFontRemove}
                    className="text-[#111111]/25 transition-colors hover:text-red-500/60"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#111111]/[0.12] py-2.5 text-[11px] transition-all ${
                  fontUploading ? 'text-[#111111]/30' : 'text-[#111111]/30 hover:border-[#111111]/25 hover:text-[#111111]/50'
                }`}>
                  {fontUploading ? (
                    <><Loader2 className="h-3 w-3 animate-spin" />Uploading&hellip;</>
                  ) : (
                    <><Upload className="h-3 w-3" />Upload .ttf / .otf</>
                  )}
                  <input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    className="hidden"
                    disabled={fontUploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) onFontUpload(f)
                      e.target.value = ''
                    }}
                  />
                </label>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Dock */}
      <div className="flex items-center gap-1 rounded-full border border-[#111111]/10 bg-white/95 p-1.5 shadow-elevated backdrop-blur-xl">
        <DockButton
          active={activeTab === 'style'}
          onClick={() => toggleTab('style')}
          icon={<Paintbrush className="h-3.5 w-3.5" />}
          label={TEMPLATE_INFO[template].subtitle}
        />
        <div className="mx-0.5 h-4 w-px bg-[#111111]/[0.08]" />
        <DockButton
          active={activeTab === 'layout'}
          onClick={() => toggleTab('layout')}
          icon={<Ruler className="h-3.5 w-3.5" />}
          label={PAGE_SIZES[pageSize]?.label || 'Size'}
        />
        <div className="mx-0.5 h-4 w-px bg-[#111111]/[0.08]" />
        <DockButton
          active={activeTab === 'settings'}
          onClick={() => toggleTab('settings')}
          icon={<Settings2 className="h-3.5 w-3.5" />}
          label="Options"
        />

        {/* Status dot */}
        <div className="mx-1.5 h-4 w-px bg-[#111111]/[0.08]" />
        <div className="flex items-center gap-1.5 px-2">
          <span className={`h-1.5 w-1.5 rounded-full transition-colors ${
            status === 'compiling' ? 'bg-[#FF3333] animate-pulse' :
            status === 'success' ? 'bg-emerald-500' :
            status === 'error' ? 'bg-red-500' :
            'bg-[#111111]/20'
          }`} />
          <span className={`font-mono text-[9px] uppercase tracking-[0.1em] ${
            status === 'compiling' ? 'text-[#FF3333]' :
            status === 'success' ? 'text-emerald-600/70' :
            status === 'error' ? 'text-red-500/70' :
            'text-[#111111]/35'
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
          ? 'bg-[#111111] text-white shadow-lg'
          : 'text-[#111111]/40 hover:bg-[#111111]/[0.05] hover:text-[#111111]/70'
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
    <div className="fixed left-0 right-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 md:px-8">
        {/* Left: back + title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111111]/[0.04] text-[#111111]/30 transition-colors hover:bg-[#111111]/[0.08] hover:text-[#111111]/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="bg-transparent font-display text-sm font-semibold text-[#111111]/60 placeholder:text-[#111111]/25 focus:text-[#111111] focus:outline-none"
            placeholder="Untitled"
          />
          <span className="font-mono text-[10px] text-[#111111]/35">
            {wordCount.toLocaleString()} words
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          {/* Errors */}
          {errors.length > 0 && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-red-500/70">
              <AlertTriangle className="h-3 w-3" />
              {errors[0].message.slice(0, 50)}
            </span>
          )}

          <button
            onClick={onToggleEditor}
            className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium transition-all ${
              showEditor
                ? 'bg-[#111111]/[0.08] text-[#111111]/60'
                : 'text-[#111111]/30 hover:bg-[#111111]/[0.04] hover:text-[#111111]/50'
            }`}
          >
            <FileText className="h-3 w-3" />
            {showEditor ? 'Preview' : 'Edit'}
          </button>

          <button
            onClick={onToggleSystems}
            className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium transition-all ${
              showSystems
                ? 'bg-[#FF3333]/10 text-[#FF3333] ring-1 ring-[#FF3333]/30'
                : 'text-[#111111]/30 hover:bg-[#111111]/[0.04] hover:text-[#111111]/50'
            }`}
          >
            <BarChart3 className="h-3 w-3" />
            Systems
          </button>

          <button
            onClick={onPublish}
            disabled={status !== 'success'}
            className="group inline-flex h-8 items-center gap-2 rounded-full bg-[#FF3333] px-5 text-[12px] font-semibold text-white transition-all hover:bg-[#E52222] disabled:opacity-30"
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
  headingVariant,
  pageSize,
  marginPreset,
  wordCount,
  manuscript,
  safeMode,
  compileMode,
  pdfUrl,
  customFont,
  onBack,
  onDownload,
  lastDownloadWatermarked,
  userTier,
  userCredits,
}: {
  title: string
  template: TemplateKey
  headingVariant: HeadingVariant
  pageSize: PageSize
  marginPreset: MarginPreset
  wordCount: number
  manuscript: string
  safeMode: boolean
  compileMode: CompileMode
  pdfUrl: string | null
  customFont: CustomFont
  onBack: () => void
  onDownload: (platform: Platform) => void
  lastDownloadWatermarked: boolean
  userTier: string
  userCredits: number
}) {
  const [platform, setPlatform] = useState<Platform>('kdp')
  const [paper, setPaper] = useState<PaperStock>('white')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf')
  const [epubLoading, setEpubLoading] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchProgress, setBatchProgress] = useState('')
  const [preflight, setPreflight] = useState<PreflightResult | null>(null)
  const [checking, setChecking] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Run real pre-flight when settings change
  useEffect(() => {
    let active = true
    setChecking(true)
    setFetchError(null)
    setPreflight(null)

    async function runPreflight() {
      try {
        const res = await fetch('/api/preflight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageSize,
            marginPreset,
            template,
            wordCount,
            platform,
            paperStock: paper,
          }),
        })
        if (!active) return
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          setFetchError(data?.message || `Pre-flight failed (${res.status})`)
          setChecking(false)
          return
        }
        const data: PreflightResult = await res.json()
        setPreflight(data)
        setChecking(false)
      } catch {
        if (active) {
          setFetchError('Could not reach pre-flight engine.')
          setChecking(false)
        }
      }
    }

    runPreflight()
    return () => { active = false }
  }, [pageSize, marginPreset, template, wordCount, platform, paper])

  const hasFailure = preflight?.checks.some(c => c.status === 'fail')
  const canDownload = !checking && !hasFailure && !fetchError && pdfUrl

  async function handleEpubDownload() {
    setEpubLoading(true)
    try {
      const body: Record<string, unknown> = {
        manuscriptText: manuscript,
        template,
        headingVariant,
        title: title || 'Manuscript',
        pageSize,
        marginPreset,
        safeMode,
        compileMode,
        outputFormat: 'epub',
      }
      if (customFont) body.customFonts = { main: customFont.fontId }

      const resp = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!resp.ok) {
        const data = await resp.json().catch(() => null)
        alert(data?.message || 'EPUB export failed.')
        return
      }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${slug(title) || 'manuscript'}.epub`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      alert('EPUB export failed. Please try again.')
    } finally {
      setEpubLoading(false)
    }
  }

  async function handleBatchExport() {
    setBatchLoading(true)
    setBatchProgress('Compiling...')
    try {
      const allSizes = Object.keys(PAGE_SIZES)
      const body: Record<string, unknown> = {
        manuscriptText: manuscript,
        template,
        title: title || 'Manuscript',
        marginPreset,
        safeMode,
        compileMode,
        pageSizes: allSizes,
      }
      if (customFont) body.customFonts = { main: customFont.fontId }

      const resp = await fetch('/api/batch-compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!resp.ok) {
        const data = await resp.json().catch(() => null)
        alert(data?.message || 'Batch export failed.')
        return
      }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${slug(title) || 'manuscript'}-batch.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      alert('Batch export failed. Please try again.')
    } finally {
      setBatchLoading(false)
      setBatchProgress('')
    }
  }

  const statusIcon = (s: PreflightCheck['status']) =>
    s === 'pass'  ? <Check className="h-3 w-3 shrink-0 text-emerald-500" /> :
    s === 'fail'  ? <X className="h-3 w-3 shrink-0 text-red-500" /> :
    s === 'warn'  ? <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" /> :
                    <span className="inline-block h-3 w-3 shrink-0 text-center font-mono text-[10px] text-[#111111]/25">·</span>

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#FDFCF8]/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease }}
        className="w-full max-w-xl px-6"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[#111111]">Export &amp; Publish</h2>
          <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111111]/[0.06] text-[#111111]/30 transition-colors hover:bg-[#111111]/[0.1] hover:text-[#111111]/50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Left column: export settings */}
          <div className="space-y-3">
            {/* Platform selector */}
            <div className="rounded-xl border border-[#111111]/[0.08] bg-white p-4">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">Target Platform</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPlatform('kdp')}
                  className={`flex-1 rounded-lg py-2 text-[11px] font-semibold transition-all ${
                    platform === 'kdp'
                      ? 'bg-[#111111] text-white'
                      : 'border border-[#111111]/[0.08] text-[#111111]/40 hover:border-[#111111]/20'
                  }`}
                >
                  Amazon KDP
                </button>
                <button
                  onClick={() => setPlatform('ingram')}
                  className={`flex-1 rounded-lg py-2 text-[11px] font-semibold transition-all ${
                    platform === 'ingram'
                      ? 'bg-[#FF3333] text-white'
                      : 'border border-[#111111]/[0.08] text-[#111111]/40 hover:border-[#111111]/20'
                  }`}
                >
                  IngramSpark
                </button>
              </div>
              <p className="mt-2 font-mono text-[10px] leading-relaxed text-[#111111]/30">
                {platform === 'kdp'
                  ? 'Standard PDF optimized for Amazon print.'
                  : 'PDF/X-1a with CMYK color profile.'}
              </p>
            </div>

            {/* Paper stock selector */}
            <div className="rounded-xl border border-[#111111]/[0.08] bg-white p-4">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">Paper Stock</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaper('white')}
                  className={`flex-1 rounded-lg py-2 text-[11px] font-medium transition-all ${
                    paper === 'white'
                      ? 'bg-[#111111] text-white'
                      : 'border border-[#111111]/[0.08] text-[#111111]/40 hover:border-[#111111]/20'
                  }`}
                >
                  White
                </button>
                <button
                  onClick={() => setPaper('cream')}
                  className={`flex-1 rounded-lg py-2 text-[11px] font-medium transition-all ${
                    paper === 'cream'
                      ? 'bg-[#f5f0d0] text-[#111111]'
                      : 'border border-[#111111]/[0.08] text-[#111111]/40 hover:border-[#111111]/20'
                  }`}
                >
                  Cream
                </button>
              </div>
            </div>
          </div>

          {/* Right column: pre-flight terminal */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-[#111111]/[0.08] bg-white">
            {/* Terminal chrome */}
            <div className="flex items-center gap-2 border-b border-[#111111]/[0.06] bg-[#111111]/[0.02] px-4 py-2.5">
              <div className={`h-2 w-2 rounded-full ${
                checking ? 'bg-amber-500 animate-pulse'
                : fetchError || hasFailure ? 'bg-red-500'
                : 'bg-emerald-500'
              }`} />
              <span className="font-mono text-[10px] text-[#111111]/30">
                PRE-FLIGHT // {platform.toUpperCase()}
              </span>
            </div>

            {/* Check results */}
            <div className="flex-1 p-4 font-mono text-[11px] leading-[1.9]">
              {checking ? (
                <div className="flex items-center gap-2 text-[#111111]/30">
                  <div className="h-3 w-3 animate-spin rounded-full border border-[#111111]/20 border-t-transparent" />
                  Running pre-flight analysis...
                </div>
              ) : fetchError ? (
                <div className="text-red-500/70">[ERROR] {fetchError}</div>
              ) : preflight ? (
                preflight.checks.map((check, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.2 }}
                    className="mb-1.5"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5">{statusIcon(check.status)}</span>
                      <div>
                        <span className={
                          check.status === 'pass' ? 'text-[#111111]/50' :
                          check.status === 'fail' ? 'text-red-600/90' :
                          check.status === 'warn' ? 'text-amber-600/80' :
                          'text-[#111111]/35'
                        }>
                          {check.name}
                        </span>
                        <p className="text-[10px] text-[#111111]/35">{check.detail}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : null}
            </div>

            {/* Real stats from backend */}
            {!checking && preflight && (
              <div className="grid grid-cols-3 gap-px border-t border-[#111111]/[0.06] bg-[#111111]/[0.03]">
                <div className="bg-white p-2.5 text-center">
                  <p className="font-mono text-[8px] uppercase tracking-wider text-[#111111]/35">Pages</p>
                  <p className="font-display text-sm font-bold text-[#111111]">~{preflight.stats.estimatedPages}</p>
                </div>
                <div className="bg-white p-2.5 text-center">
                  <p className="font-mono text-[8px] uppercase tracking-wider text-[#111111]/35">Spine</p>
                  <p className="font-display text-sm font-bold text-[#111111]">{preflight.stats.spineInches}&quot;</p>
                </div>
                <div className="bg-white p-2.5 text-center">
                  <p className="font-mono text-[8px] uppercase tracking-wider text-[#111111]/35">Trim</p>
                  <p className="font-display text-sm font-bold text-[#111111]">{preflight.stats.trimWidth}&times;{preflight.stats.trimHeight}&quot;</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Format selector */}
        <div className="mt-4 mb-3 flex rounded-lg bg-[#111111]/[0.03] p-0.5">
          {(['pdf', 'epub'] as ExportFormat[]).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setExportFormat(fmt)}
              className={`flex-1 rounded-md px-3 py-2 text-center text-[11px] font-medium transition-all duration-150 ${
                exportFormat === fmt
                  ? 'bg-[#111111]/[0.08] text-[#111111]'
                  : 'text-[#111111]/40 hover:text-[#111111]/60'
              }`}
            >
              {fmt === 'pdf' ? 'PDF' : 'EPUB'}
            </button>
          ))}
        </div>

        {/* Download buttons */}
        <div className="space-y-2">
          {exportFormat === 'pdf' ? (
            <button
              onClick={() => onDownload(platform)}
              disabled={!canDownload}
              className="group inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#FF3333] font-display text-[14px] font-semibold text-white transition-all hover:bg-[#E52222] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              {platform === 'ingram' ? 'Download PDF/X-1a' : 'Download Print PDF'}
            </button>
          ) : (
            <button
              onClick={handleEpubDownload}
              disabled={epubLoading}
              className="group inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#FF3333] font-display text-[14px] font-semibold text-white transition-all hover:bg-[#E52222] disabled:opacity-50"
            >
              {epubLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Generating EPUB&hellip;</>
              ) : (
                <><Download className="h-4 w-4" />Download EPUB</>
              )}
            </button>
          )}

          {/* Batch export */}
          <button
            onClick={handleBatchExport}
            disabled={batchLoading || !pdfUrl}
            className="group inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#111111]/[0.08] text-[12px] font-medium text-[#111111]/40 transition-all hover:border-[#111111]/20 hover:text-[#111111]/60 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {batchLoading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />{batchProgress || 'Batch exporting...'}</>
            ) : (
              <><Package className="h-3.5 w-3.5" />Batch Export — All Sizes (ZIP)</>
            )}
          </button>
        </div>

        {/* Failure message */}
        {exportFormat === 'pdf' && !checking && hasFailure && (
          <p className="mt-3 text-center font-mono text-[10px] text-red-500/60">
            One or more checks failed. Fix the issues above before downloading.
          </p>
        )}

        {/* Watermark / credit notice */}
        {lastDownloadWatermarked && (
          <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2 text-center">
            <p className="font-mono text-[10px] text-amber-700/70">
              Free tier — PDF includes watermark.{' '}
              <a href="/pricing" className="underline hover:text-amber-800">Upgrade</a>{' '}
              or buy a single clean PDF for £2.99.
            </p>
          </div>
        )}
        {userTier === 'drafter' && userCredits > 0 && (
          <p className="mt-2 text-center font-mono text-[10px] text-emerald-600/60">
            {userCredits} clean PDF credit{userCredits !== 1 ? 's' : ''} remaining
          </p>
        )}


        <p className="mt-3 text-center font-mono text-[10px] text-[#111111]/25">
          {TEMPLATE_INFO[template]?.name} / {PAGE_SIZES[pageSize]?.label} / {title || 'Untitled'}
        </p>
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
      className="fixed bottom-24 right-6 z-50 rounded-xl border border-[#111111]/10 bg-white p-4 shadow-elevated backdrop-blur-xl"
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
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 flex"
    >
      {/* Left half: editor */}
      <div className="flex w-1/2 flex-col border-r border-[#111111]/[0.08] bg-white">
        <div className="flex items-center justify-between border-b border-[#111111]/[0.06] px-5 py-2.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#111111]/30">Manuscript</span>
          <button onClick={onClose} className="font-mono text-[11px] text-[#111111]/30 hover:text-[#111111]/50">
            Close
          </button>
        </div>
        <textarea
          value={manuscript}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 resize-none bg-transparent p-6 font-mono text-sm leading-[1.8] text-[#111111]/70 caret-[#FF3333] focus:outline-none"
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
  const [headingVariant, setHeadingVariant] = useState<HeadingVariant>('classic')
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
  const [customFont, setCustomFont] = useState<CustomFont>(null)
  const [fontUploading, setFontUploading] = useState(false)
  const [lastDownloadWatermarked, setLastDownloadWatermarked] = useState(false)

  const { session, tier, pdfCredits, refreshUser } = useAuth()

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
      if (p.headingVariant) setHeadingVariant(p.headingVariant)
      if (p.pageSize) setPageSize(p.pageSize)
      if (p.marginPreset) setMarginPreset(p.marginPreset)
      if (typeof p.safeMode === 'boolean') setSafeMode(p.safeMode)
      if (typeof p.title === 'string' && p.title.trim()) setTitle(p.title)
    } catch { /* ignore */ }
  }, [])

  // Save preferences
  useEffect(() => {
    if (stage === 'portal') return
    const prefs: Prefs = { template, pageSize, marginPreset, safeMode, title, headingVariant }
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)) } catch { /* ignore */ }
  }, [template, headingVariant, pageSize, marginPreset, safeMode, title, stage])

  // Debounced auto-compile in design stage
  useEffect(() => {
    if (stage !== 'design' || !manuscript.trim()) return
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => { void compile(false) }, 1000)
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manuscript, template, headingVariant, title, pageSize, marginPreset, safeMode, compileMode, stage])

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

  async function compile(downloadAfter: boolean, exportPlatform?: Platform) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

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
      if (downloadAfter) {
        body.download = true
      }
      if (exportPlatform === 'ingram') {
        body.outputFormat = 'pdfx1a'
      }
      if (customFont) {
        body.customFonts = { main: customFont.fontId }
      }
      // Build headers — include auth token for download tier/credit checks
      const fetchHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
      if (downloadAfter && isPocketBaseConfigured) {
        const pb = createClient()
        if (pb.authStore.isValid && pb.authStore.token) {
          fetchHeaders['Authorization'] = `Bearer ${pb.authStore.token}`
        }
      }
      const resp = await fetch('/api/compile', {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify(body),
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

          // Check watermark/credit response headers
          const wasWatermarked = resp.headers.get('x-pp-watermarked') === 'true'
          setLastDownloadWatermarked(wasWatermarked)
          const remaining = resp.headers.get('x-pp-credits-remaining')
          if (remaining !== null) {
            // Credit was used — refresh user data to update pdfCredits
            refreshUser()
          }
        } else {
          setLastDownloadWatermarked(false)
        }
      } else {
        let payload: { message?: string; error?: string; detail?: string } | null = null
        try { payload = await resp.json() } catch { /* noop */ }
        pdfBlobRef.current = null
        const msgs: CompileError[] = []
        if (payload?.message) msgs.push({ message: payload.message })
        if (payload?.detail) msgs.push({ message: payload.detail })
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
              errors={errors}
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
                headingVariant={headingVariant}
                pageSize={pageSize}
                marginPreset={marginPreset}
                compileMode={compileMode}
                safeMode={safeMode}
                status={status}
                activeTab={hudTab}
                customFont={customFont}
                fontUploading={fontUploading}
                onTabChange={setHudTab}
                onTemplateChange={setTemplate}
                onHeadingVariantChange={setHeadingVariant}
                onPageSizeChange={setPageSize}
                onMarginChange={setMarginPreset}
                onCompileModeChange={setCompileMode}
                onSafeModeChange={setSafeMode}
                onFontUpload={handleFontUpload}
                onFontRemove={handleFontRemove}
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
            userCredits={pdfCredits}
          />
        )}
      </AnimatePresence>
    </>
  )
}
