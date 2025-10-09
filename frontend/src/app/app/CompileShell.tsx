'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SAMPLE_MD } from './sample'
import TemplateHelp from './TemplateHelp'
import TemplateNotes from './TemplateNotes'

type TemplateKey = 'minimal' | 'symphony' | 'chronicle' | 'exhibit' | 'matrix' | 'avantgarde' | 'chicago' | 'paperback'
type PageSize = 'letter' | 'a4' | 'sixByNine' | 'fiveFiveByEightFive' | 'a5' | 'sevenByTen' | 'amazonFiveByEight' | 'amazonSixByNine' | 'amazonSevenByTen' | 'amazonEightByTen' | 'amazonEightFiveByEleven'
type MarginPreset = 'normal' | 'narrow' | 'wide' | 'minimal' | 'academic' | 'generous' | 'compact'
type CompileError = { message: string }
type Status = 'idle' | 'compiling' | 'success' | 'error'

const PREFS_KEY = 'pp-prefs-v1'
type Prefs = {
  template: TemplateKey
  pageSize: PageSize
  marginPreset: MarginPreset
  safeMode: boolean
  title: string
}

const DEFAULT_MD = `# Chapter 1: The New World

The **17th century** was a pivotal time for maritime trade. Ships like the *Sea Serpent* sailed from Bristol to the New World. As noted by [@Finch2023], this had profound economic implications.

## The Economics of Trade

Trade was driven by prices, risk, and information flows across the Atlantic. See also [@Braudel1982].

# References
`

// No longer needed - using Next.js rewrites to proxy /api/* to Railway
// const BACKEND = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, '') || 'http://localhost:4000'

// Filename helper functions
function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/['']/g, '')                 // drop apostrophes
    .replace(/[^a-z0-9]+/g, '-')          // non-alnum -> dashes
    .replace(/^-+|-+$/g, '')              // trim dashes
    .slice(0, 60)
}

function sizeCode(size: PageSize) {
  switch (size) {
    case 'a4': return 'a4'
    case 'a5': return 'a5'
    case 'sixByNine': return '6x9'
    case 'fiveFiveByEightFive': return '5.5x8.5'
    case 'sevenByTen': return '7x10'
    case 'amazonFiveByEight': return 'amazon-5x8'
    case 'amazonSixByNine': return 'amazon-6x9'
    case 'amazonSevenByTen': return 'amazon-7x10'
    case 'amazonEightByTen': return 'amazon-8x10'
    case 'amazonEightFiveByEleven': return 'amazon-8.5x11'
    case 'letter':
    default: return 'letter'
  }
}

function templateCode(t: TemplateKey) {
  switch (t) {
    case 'symphony': return 'symphony'
    case 'chronicle': return 'chronicle'
    case 'exhibit': return 'exhibit'
    case 'matrix': return 'matrix'
    case 'avantgarde': return 'avantgarde'
    case 'paperback': return 'paperback'
    case 'chicago':
    default: return 'chicago'
  }
}

function timestamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
}

function buildFilename(title: string, t: TemplateKey, size: PageSize) {
  const left = slug(title) || 'manuscript'
  return `${left}_${templateCode(t)}_${sizeCode(size)}_${timestamp()}.pdf`
}

function cleanFromWord(input: string): string {
  if (!input) return input
  let s = input

  // Normalize line endings and spaces
  s = s.replace(/\r\n?/g, '\n')
  s = s.replace(/[\u00A0\u2007\u202F]/g, ' ') // NBSP & narrow NBSPs → space
  s = s.replace(/\t/g, ' ')

  // Smart quotes/apostrophes → straight ASCII
  s = s.replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"') // " " „ ‟ « »
  s = s.replace(/[\u2018\u2019\u2032]/g, "'")                  // ' ' ′

  // Ellipsis
  s = s.replace(/\u2026/g, '...')

  // Dashes: en/em to em with spaces around (XeLaTeX handles Unicode)
  s = s.replace(/\s*[\u2013\u2014]\s*/g, ' — ')

  // Word bullets at line start → markdown dashes
  s = s.replace(/^[\s]*[•·]\s?/gm, '- ')

  // Collapse 3+ newlines → 2 (paragraph break)
  s = s.replace(/\n{3,}/g, '\n\n')

  // After punctuation, collapse double+ spaces → single
  s = s.replace(/([.!?;:])\s{2,}/g, '$1 ')

  // Trim trailing spaces per line
  s = s.split('\n').map(l => l.replace(/\s+$/,'')).join('\n')

  return s
}

// Chapter helper functions
// Demote H1 chapter headings to H2 for Paperback, leave others alone
function adjustHeadingsForTemplate(md: string, template: TemplateKey): string {
  if (template !== 'paperback') return md
  // Only demote lines that look like "# Chapter ..." (case-insensitive)
  return md.replace(/^#\s+(chapter\b.*)$/gim, '## $1')
}

// Find the next Chapter number by scanning "# Chapter N" headings
function nextChapterNumber(md: string) {
  const re = /^#\s*Chapter\s+(\d+)\b/igm
  let max = 0, m
  while ((m = re.exec(md)) !== null) {
    const n = parseInt(m[1], 10)
    if (!Number.isNaN(n)) max = Math.max(max, n)
  }
  return max + 1
}

// Build a Markdown chapter skeleton with a LaTeX page break
function chapterSkeleton(n: number, template: TemplateKey) {
  const h = template === 'paperback' ? '##' : '#'
  return `\\newpage

${h} Chapter ${n} — Your Title Here

Intro paragraph. Set the scene and thesis for this chapter.

${h}# Section 1
Write a few sentences. Cite sources like [@Finch2023].

${h}# Section 2
Continue your argument. Use *italics*/**bold** sparingly.

`
}

// Insert text at the current caret position in the textarea
function insertAtCursor(el: HTMLTextAreaElement, source: string, setValue: (s: string) => void) {
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? start
  const before = el.value.slice(0, start)
  const after = el.value.slice(end)
  const next = before + source + after
  setValue(next)
  // Restore caret right after inserted block
  const pos = start + source.length
  setTimeout(() => {
    el.selectionStart = pos
    el.selectionEnd = pos
    el.focus()
  }, 0)
}

const STATUS_LABEL: Record<Status, string> = {
  idle: 'Idle',
  compiling: 'Compiling…',
  success: 'Ready',
  error: 'Failed',
}

const STATUS_CLASS: Record<Status, string> = {
  idle: 'bg-ens-gray-200 text-ens-midnight',
  compiling: 'bg-ens-blue text-white animate-pulse',
  success: 'bg-ens-green text-white',
  error: 'bg-red-600 text-white', // tailwind red for clear failure
}

function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-pill px-5 py-3 font-semibold shadow-pill transition ${STATUS_CLASS[status]}`}
      aria-live="polite"
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

export default function CompileShell() {
  const [manuscript, setManuscript] = useState(DEFAULT_MD)
  const [template, setTemplate] = useState<TemplateKey>('minimal')
  const [title, setTitle] = useState<string>('Maritime Trade in the 17th Century')
  const [pageSize, setPageSize] = useState<PageSize>('letter')
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('normal')
  const [safeMode, setSafeMode] = useState<boolean>(false)
  const [showFormatting, setShowFormatting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<CompileError[]>([])
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [missingCitations, setMissingCitations] = useState<string[]>([])
  const [missingPackages, setMissingPackages] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [lastErrorJson, setLastErrorJson] = useState<{
    httpStatus: number | string
    response: unknown
    when: string
  } | null>(null)

  const CLEAN_KEY = 'pp-clean-on-paste-v1'
  const [cleanOnPaste, setCleanOnPaste] = useState<boolean>(true)

  const debounceRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const textRef = useRef<HTMLTextAreaElement | null>(null)

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
    } catch {
      // ignore malformed storage
    }
  }, [])

  // Save preferences whenever they change
  useEffect(() => {
    const prefs: Prefs = { template, pageSize, marginPreset, safeMode, title }
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)) } catch {}
  }, [template, pageSize, marginPreset, safeMode, title])

  // Load cleanOnPaste setting on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLEAN_KEY)
      if (raw != null) setCleanOnPaste(raw === '1')
    } catch {}
  }, [])

  // Save cleanOnPaste setting when it changes
  useEffect(() => {
    try { localStorage.setItem(CLEAN_KEY, cleanOnPaste ? '1' : '0') } catch {}
  }, [cleanOnPaste])

  // Debounced auto-compile
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => { void compile(false) }, 1000)
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manuscript, template, title, pageSize, marginPreset, safeMode])

  async function compile(downloadAfter: boolean) {
    // cancel any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setStatus('compiling')
    setErrors([])

    try {
      const effectiveMd = adjustHeadingsForTemplate(manuscript, template)
      const requestBody = { manuscriptText: effectiveMd, template, title, pageSize, marginPreset, safeMode };
      console.log('Sending compile request:', requestBody);
      const resp = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })
      const ct = resp.headers.get('content-type') || ''

      if (resp.ok && ct.includes('application/pdf')) {
        const blob = await resp.blob()
        setPdfBlob(blob)
        setLastErrorJson(null) // clear previous errors
        const url = URL.createObjectURL(blob)
        setPdfUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url })
        setStatus('success')
        setMissingCitations([])
        setMissingPackages([])
        setWarnings([])
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
        // expect a JSON error (501 for now)
        let payload: { message?: string; error?: string; missingCitations?: string[]; missingPackages?: string[]; warnings?: string[] } | null = null
        try { payload = await resp.json() } catch { /* noop */ }
        setPdfBlob(null)
        setLastErrorJson({
          httpStatus: resp.status,
          response: payload ?? null,
          when: new Date().toISOString(),
        })
        const msgs: CompileError[] = []
        if (payload?.message) msgs.push({ message: payload.message })
        if (payload?.error) msgs.push({ message: String(payload.error) })
        if (!msgs.length) msgs.push({ message: `Compile failed (status ${resp.status}).` })
        setErrors(msgs)
        setStatus('error')
        setMissingCitations(Array.isArray(payload?.missingCitations) ? payload.missingCitations : [])
        setMissingPackages(Array.isArray(payload?.missingPackages) ? payload.missingPackages : [])
        setWarnings(Array.isArray(payload?.warnings) ? payload.warnings : [])
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setPdfBlob(null)
        setLastErrorJson({ httpStatus: 'network', response: String(e?.message || e), when: new Date().toISOString() })
        setErrors([{ message: 'Network or server error. Please try again.' }])
        setStatus('error')
      }
    } finally {
      setLoading(false)
    }
  }

  async function downloadDebugBundle() {
    const { default: JSZip } = await import('jszip')
    const zip = new JSZip()

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const stamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`

    const settings = {
      title, template, pageSize, marginPreset, safeMode,
      status,
      ts: now.toISOString()
    }

    const readme =
`Page Perfect Debug Bundle

Files:
- manuscript.md        → Current editor contents
- settings.json        → Compile parameters and UI status
- last-error.json      → Last error response (if any)
- output.pdf           → Last compiled PDF (if available)

Notes:
• This bundle may contain sensitive content from your manuscript.
• Remove anything you don't want to share before sending.`

    zip.file('README.txt', readme)
    zip.file('manuscript.md', manuscript)
    zip.file('settings.json', JSON.stringify(settings, null, 2))
    if (lastErrorJson) zip.file('last-error.json', JSON.stringify(lastErrorJson, null, 2))
    if (pdfBlob) zip.file('output.pdf', pdfBlob)

    const blob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `pp-debug-${stamp}.zip`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 0)
  }

  const Spinner = useMemo(
    () => (
      <div className="absolute inset-0 grid place-items-center bg-white/70">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-ens-blue border-t-transparent" aria-hidden="true" />
        <span className="sr-only">Compiling…</span>
      </div>
    ),
    []
  )

  return (
    <div className="min-h-[calc(100vh-0px)]">
            {/* Top bar */}
            <div className="sticky top-0 z-10">
              <div className="container-grid py-4">
                <div className="bg-white border border-ens-gray-200 rounded-2xl shadow-card px-4 md:px-6 py-3 flex flex-col md:flex-row items-start md:items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image 
              src="/PagePerfect_1_Icon.png" 
              alt="Page Perfect" 
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="font-display text-xl font-black tracking-tight text-ens-dark">
              Page Perfect
            </span>
          </Link>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center md:ml-auto">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Manuscript title"
              aria-label="Manuscript title"
              className="rounded-lg border border-ens-gray-200 bg-white px-3 py-2 min-w-[200px] max-w-[300px]"
            />
            <div className="flex items-center gap-3">
              <button className="btn-pill btn-primary" onClick={() => compile(true)}>
                Download PDF
              </button>
              <StatusPill status={status} />
            </div>
          </div>
                </div>
              </div>
            </div>

      {/* Formatting Controls Panel */}
      <div className="container-grid py-4 md:py-6">
        <div className="card p-0 overflow-hidden">
          <button
            onClick={() => setShowFormatting(!showFormatting)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-ens-light/30 transition-colors border-b border-ens-gray-200"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ens-midnight">Formatting Options</span>
              <span className="small-mono text-ens-gray-700">
                {template} • {pageSize} • {marginPreset}
              </span>
            </div>
            <span className="small-mono text-ens-gray-700">
              {showFormatting ? 'Hide' : 'Show'} formatting
            </span>
          </button>
          
          {showFormatting && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Template */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="small-mono" htmlFor="template">Template</label>
                    <TemplateHelp />
                  </div>
                  <select
                    id="template"
                    className="rounded-lg border border-ens-gray-200 bg-white px-3 py-2"
                    value={template}
                    onChange={(e) => setTemplate(e.target.value as TemplateKey)}
                  >
                    <option value="symphony">Symphony Layout - Classic Academic</option>
                    <option value="chronicle">Chronicle Grid - Editorial Style</option>
                    <option value="exhibit">Exhibit Frame - Modern Trade</option>
                    <option value="matrix">Corporate Matrix - Business</option>
                    <option value="avantgarde">Avant-Garde Canvas - Creative</option>
                    <option value="chicago">Classic Academic (Chicago) - Legacy</option>
                    <option value="paperback">Modern Trade Paperback - Legacy</option>                  </select>
                </div>

                {/* Page Size */}
                <div className="flex flex-col gap-2">
                  <label className="small-mono" htmlFor="pageSize">Page size</label>
                  <select
                    id="pageSize"
                    className="rounded-lg border border-ens-gray-200 bg-white px-3 py-2"
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as PageSize)}
                  >
                    <option value="letter">US Letter (8.5×11&quot;)</option>
                    <option value="a4">A4 (210×297 mm)</option>
                    <option value="sixByNine">Trade 6×9&quot;</option>
                    <option value="fiveFiveByEightFive">Digest 5.5×8.5&quot;</option>
                    <option value="sevenByTen">7×10&quot;</option>
                    <option value="a5">A5 (148×210 mm)</option>
                    <optgroup label="Amazon KDP Sizes">
                      <option value="amazonFiveByEight">Amazon 5×8&quot;</option>
                      <option value="amazonSixByNine">Amazon 6×9&quot;</option>
                      <option value="amazonSevenByTen">Amazon 7×10&quot;</option>
                      <option value="amazonEightByTen">Amazon 8×10&quot;</option>
                      <option value="amazonEightFiveByEleven">Amazon 8.5×11&quot;</option>
                    </optgroup>
                  </select>
                </div>

                {/* Margins */}
                <div className="flex flex-col gap-2">
                  <label className="small-mono" htmlFor="margins">Margins</label>
                  <select
                    id="margins"
                    className="rounded-lg border border-ens-gray-200 bg-white px-3 py-2"
                    value={marginPreset}
                    onChange={(e) => setMarginPreset(e.target.value as MarginPreset)}
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

                {/* Safe Mode */}
                <div className="flex items-center gap-2">
                  <label htmlFor="safeMode" className="small-mono">Safe mode</label>
                  <input
                    id="safeMode"
                    type="checkbox"
                    checked={safeMode}
                    onChange={(e) => setSafeMode(e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                    title="Compile without citations/bibliography"
                  />
                </div>

                {/* Reset Preferences */}
                <button
                  type="button"
                  className="small-mono underline text-ens-blue/80 hover:opacity-80"
                  onClick={() => {
                    try { localStorage.removeItem(PREFS_KEY) } catch {}
                    // revert to sensible defaults
                    setTemplate('minimal')
                    setPageSize('letter')
                    setMarginPreset('normal')
                    setSafeMode(false)
                    setTitle('Maritime Trade in the 17th Century')
                  }}
                  title="Clear saved preferences"
                >
                  Reset prefs
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Safe Mode Banner */}
      {safeMode && (
        <div className="mb-3 rounded-lg border border-yellow-300 bg-yellow-50 p-3">
          <div className="text-sm text-gray-800">
            <strong>Safe mode:</strong> Citations and bibliography are disabled for this compile.
          </div>
        </div>
      )}

      {/* Two-panel layout */}
      <div className="container-grid py-4 md:py-6">
        <TemplateNotes />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left: Editor + Error console */}
          <div className="flex flex-col gap-3">
            <div className="card p-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b px-3 py-2 gap-2">
                <div className="small-mono">Editor</div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <div className="flex gap-2">
                    <button
                      className="small-mono underline text-ens-blue hover:opacity-80 text-sm"
                      onClick={() => setManuscript(SAMPLE_MD)}
                      type="button"
                    >
                      Load sample
                    </button>
                    <button
                      className="small-mono underline text-ens-blue/80 hover:opacity-80 text-sm"
                      onClick={() => setManuscript('# Your manuscript in Markdown…')}
                      type="button"
                    >
                      Reset
                    </button>
                  </div>
                  
                  {/* Clean on paste toggle */}
                  <label className="small-mono inline-flex items-center gap-2 text-sm" title="Normalize Word punctuation, bullets, and spaces when pasting">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-ens-blue"
                      checked={cleanOnPaste}
                      onChange={(e) => setCleanOnPaste(e.target.checked)}
                    />
                    Clean on paste
                  </label>

                  {/* One-click clean */}
                  <button
                    type="button"
                    className="small-mono underline text-ens-blue hover:opacity-80 text-sm"
                    onClick={() => setManuscript(m => cleanFromWord(m))}
                    title="Normalize the entire manuscript now"
                  >
                    Clean now
                  </button>

                  {/* Insert Chapter */}
                  <button
                    type="button"
                    className="small-mono underline text-ens-blue hover:opacity-80 text-sm"
                    title="Insert a numbered chapter heading with a page break"
                    onClick={() => {
                      const el = textRef.current
                      if (!el) return
                      const n = nextChapterNumber(manuscript)
                      insertAtCursor(el, chapterSkeleton(n, template), setManuscript)
                    }}
                  >
                    Insert chapter
                  </button>
                  
                  <StatusPill status={status} />
                </div>
              </div>
              <textarea
                ref={textRef}
                value={manuscript}
                onChange={(e) => setManuscript(e.target.value)}
                onPaste={(e) => {
                  if (!cleanOnPaste) return
                  const t = e.clipboardData?.getData('text/plain') ?? ''
                  if (!t) return
                  e.preventDefault()
                  const cleaned = cleanFromWord(t)
                  const el = e.currentTarget
                  const start = el.selectionStart ?? manuscript.length
                  const end = el.selectionEnd ?? start
                  const next = manuscript.slice(0, start) + cleaned + manuscript.slice(end)
                  setManuscript(next)
                  // Restore caret on next tick
                  setTimeout(() => {
                    const pos = start + cleaned.length
                    if (textRef.current) {
                      textRef.current.selectionStart = pos
                      textRef.current.selectionEnd = pos
                      textRef.current.focus()
                    }
                  }, 0)
                }}
                className="h-[50vh] sm:h-[60vh] w-full resize-vertical p-4 outline-none"
                placeholder="# Your manuscript in Markdown…"
                aria-label="Manuscript editor"
              />
            </div>

            {/* Error console */}
            <div className="card p-4" role="region" aria-live="polite" aria-label="Error console">
              <div className="mb-2 flex items-center justify-between">
                <div className="small-mono">Errors & Warnings</div>
                <button
                  type="button"
                  onClick={downloadDebugBundle}
                  className="btn-pill btn-secondary"
                  title="Download a .zip with manuscript, settings, last error, and (if available) the last PDF"
                >
                  Share debug bundle (.zip)
                </button>
              </div>
              
              {/* Missing citations block */}
              {missingCitations.length > 0 && (
                <div
                  className="mb-3 rounded-lg border border-red-300 bg-red-50 p-3"
                  role="alert"
                  aria-live="polite"
                >
                  <div className="font-semibold text-red-800">Undefined citations</div>
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {missingCitations.map(k => (
                      <li key={k} className="rounded-md bg-white px-2 py-0.5 text-sm text-red-800 shadow">
                        <code>[@{k}]</code>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-red-900">
                    Make sure each key exists in <code>references.bib</code>, the spelling matches exactly, and the file is valid BibTeX.
                  </p>
                </div>
              )}

              {/* Style warnings (non-fatal hints from backend) */}
              {warnings.length > 0 && (
                <div className="mb-3 rounded-lg border border-ens-yellow bg-yellow-50 p-3" role="note">
                  <div className="font-semibold text-ens-midnight">Style warnings</div>
                  <ul className="mt-1 list-disc pl-5 text-sm text-ens-midnight">
                    {warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              {/* Missing LaTeX packages (hint for ops) */}
              {missingPackages.length > 0 && (
                <div className="mb-3 rounded-lg border border-ens-gray-300 bg-ens-light p-3">
                  <div className="font-semibold text-ens-midnight">LaTeX packages missing</div>
                  <p className="mt-1 text-sm text-ens-midnight">
                    The compiler image may need additional TeX packages: {missingPackages.join(', ')}.
                  </p>
                  <p className="mt-1 text-xs text-ens-gray-700">
                    (Maintainers: add via <code>tlmgr install &lt;pkg&gt;</code> in the Dockerfile.)
                  </p>
                </div>
              )}

              {errors.length === 0 && missingCitations.length === 0 && warnings.length === 0 && missingPackages.length === 0 ? (
                <p className="text-sm text-ens-gray-700">No issues detected.</p>
              ) : (
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((e, i) => (
                    <li key={i} className="text-sm text-red-700">{e.message}</li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-ens-gray-700">
                Examples: <code>Undefined citation: &apos;Finch2023&apos;</code>, double spaces after a period, missing package, etc.
              </p>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="relative card overflow-hidden">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <div className="small-mono">Preview</div>
              <div className="small-mono text-ens-gray-700">PDF</div>
            </div>
            <div className="relative h-[50vh] sm:h-[70vh] bg-ens-light">
              {pdfUrl ? (
                <iframe title="PDF preview" src={pdfUrl} className="h-full w-full" />
              ) : (
                <div className="grid h-full place-items-center text-ens-gray-700 px-6 text-center">
                  <p className="text-sm">Your PDF preview will appear here.</p>
                </div>
              )}
              {loading && Spinner}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}