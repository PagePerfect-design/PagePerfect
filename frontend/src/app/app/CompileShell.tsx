'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { SAMPLE_MD } from './sample'
import TemplateHelp from './TemplateHelp'

type TemplateKey = 'minimal' | 'symphony' | 'chronicle' | 'exhibit' | 'matrix' | 'avantgarde' | 'chicago' | 'paperback'
type PageSize = 'letter' | 'a4' | 'sixByNine' | 'fiveFiveByEightFive' | 'a5' | 'sevenByTen' | 'amazonFiveByEight' | 'amazonSixByNine' | 'amazonSevenByTen' | 'amazonEightByTen' | 'amazonEightFiveByEleven'
type MarginPreset = 'normal' | 'narrow' | 'wide' | 'minimal' | 'academic' | 'generous' | 'compact'
type CompileMode = 'fast' | 'full'
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

const TEMPLATE_INFO: Record<string, { name: string; desc: string; tag: string }> = {
  symphony:    { name: 'Symphony',     desc: 'Classic scholarly style',      tag: 'Academic' },
  chronicle:   { name: 'Chronicle',    desc: 'Editorial multi-column grid',  tag: 'Editorial' },
  exhibit:     { name: 'Exhibit',      desc: 'Modern clean trade design',    tag: 'Trade' },
  matrix:      { name: 'Matrix',       desc: 'Structured corporate layout',  tag: 'Business' },
  avantgarde:  { name: 'Avant-Garde',  desc: 'Experimental creative style',  tag: 'Creative' },
  chicago:     { name: 'Chicago',      desc: 'Traditional academic legacy',  tag: 'Legacy' },
  paperback:   { name: 'Paperback',    desc: 'Contemporary trade book',      tag: 'Fiction' },
}

// Filename helper functions
function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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

// Chapter helpers
function adjustHeadingsForTemplate(md: string, template: TemplateKey): string {
  if (template !== 'paperback') return md
  return md.replace(/^#\s+(chapter\b.*)$/gim, '## $1')
}

function nextChapterNumber(md: string) {
  const re = /^#\s*Chapter\s+(\d+)\b/igm
  let max = 0, m
  while ((m = re.exec(md)) !== null) {
    const n = parseInt(m[1], 10)
    if (!Number.isNaN(n)) max = Math.max(max, n)
  }
  return max + 1
}

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

function insertAtCursor(el: HTMLTextAreaElement, source: string, setValue: (s: string) => void) {
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? start
  const before = el.value.slice(0, start)
  const after = el.value.slice(end)
  const next = before + source + after
  setValue(next)
  const pos = start + source.length
  setTimeout(() => {
    el.selectionStart = pos
    el.selectionEnd = pos
    el.focus()
  }, 0)
}

const STATUS_LABEL: Record<Status, string> = {
  idle: 'Ready',
  compiling: 'Typesetting...',
  success: 'PDF Ready',
  error: 'Issue Found',
}

const STATUS_DOT: Record<Status, string> = {
  idle: 'bg-text-ghost',
  compiling: 'bg-accent animate-pulse',
  success: 'bg-success',
  error: 'bg-danger',
}

const STATUS_CLASS: Record<Status, string> = {
  idle: 'bg-surface-subtle text-text-tertiary',
  compiling: 'bg-accent/10 text-accent',
  success: 'bg-success/10 text-success',
  error: 'bg-danger/10 text-danger',
}

function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-xs font-medium transition ${STATUS_CLASS[status]}`}
      aria-live="polite"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  )
}

// Welcome screen for first-time users
function WelcomeScreen({ onStart, onLoadSample }: { onStart: () => void; onLoadSample: () => void }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span className="font-mono text-xs text-accent">Ready to typeset</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Let&apos;s make your manuscript look incredible
          </h1>
          <p className="text-text-secondary text-lg max-w-md mx-auto">
            Paste your text, pick a template, and get a print-ready PDF in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={onStart}
            className="card p-6 text-left transition-all duration-200 hover:border-accent/20 hover:shadow-glow-accent hover:-translate-y-0.5 group"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-3 group-hover:bg-accent/15 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-display font-bold text-text-primary mb-1">Start fresh</h3>
            <p className="text-xs text-text-tertiary">Open the editor and paste your own text</p>
          </button>

          <button
            onClick={onLoadSample}
            className="card p-6 text-left transition-all duration-200 hover:border-[rgba(255,255,255,0.1)] hover:shadow-card-hover hover:-translate-y-0.5 group"
          >
            <div className="w-10 h-10 rounded-lg bg-surface-subtle border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-text-tertiary mb-3 group-hover:text-text-secondary transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="font-display font-bold text-text-primary mb-1">Try a sample</h3>
            <p className="text-xs text-text-tertiary">See what PagePerfect can do with example text</p>
          </button>
        </div>

        <p className="mt-8 text-xs text-text-ghost animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Your text is never stored. It&apos;s sent to our server only for compilation and immediately deleted.
        </p>
      </div>
    </div>
  )
}

export default function CompileShell() {
  const searchParams = useSearchParams()
  const [manuscript, setManuscript] = useState('')
  const [template, setTemplate] = useState<TemplateKey>('symphony')
  const [title, setTitle] = useState<string>('')
  const [pageSize, setPageSize] = useState<PageSize>('sixByNine')
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('normal')
  const [safeMode, setSafeMode] = useState<boolean>(true)
  const [compileMode, setCompileMode] = useState<CompileMode>('fast')
  const [showFormatting, setShowFormatting] = useState(true)
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
  const [showWelcome, setShowWelcome] = useState(true)
  const [hasStarted, setHasStarted] = useState(false)

  const CLEAN_KEY = 'pp-clean-on-paste-v1'
  const [cleanOnPaste, setCleanOnPaste] = useState<boolean>(true)

  const debounceRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const textRef = useRef<HTMLTextAreaElement | null>(null)

  // Read template from URL params
  useEffect(() => {
    const urlTemplate = searchParams.get('template')
    if (urlTemplate && urlTemplate in TEMPLATE_INFO) {
      setTemplate(urlTemplate as TemplateKey)
      // If coming from homepage with a template, skip welcome
      setShowWelcome(false)
      setHasStarted(true)
      setManuscript('# Your Manuscript\n\nStart writing here...\n')
      setTitle('My Manuscript')
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
    } catch {
      // ignore malformed storage
    }
  }, [])

  // Save preferences whenever they change
  useEffect(() => {
    if (!hasStarted) return
    const prefs: Prefs = { template, pageSize, marginPreset, safeMode, title }
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)) } catch {}
  }, [template, pageSize, marginPreset, safeMode, title, hasStarted])

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

  // Debounced auto-compile — only when user has started editing
  useEffect(() => {
    if (!hasStarted || !manuscript.trim()) return
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => { void compile(false) }, 1000)
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manuscript, template, title, pageSize, marginPreset, safeMode, compileMode, hasStarted])

  async function compile(downloadAfter: boolean) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setStatus('compiling')
    setErrors([])

    try {
      const effectiveMd = adjustHeadingsForTemplate(manuscript, template)
      const requestBody = { manuscriptText: effectiveMd, template, title: title || 'Manuscript', pageSize, marginPreset, safeMode, compileMode }
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
        setLastErrorJson(null)
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
    const settings = { title, template, pageSize, marginPreset, safeMode, status, ts: now.toISOString() }
    zip.file('README.txt', 'PagePerfect Debug Bundle\n\nFiles:\n- manuscript.md\n- settings.json\n- last-error.json (if any)\n- output.pdf (if available)')
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
      <div className="absolute inset-0 grid place-items-center bg-surface/60 backdrop-blur-sm z-10">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-hidden="true" />
          <span className="text-xs text-text-tertiary">Typesetting...</span>
        </div>
        <span className="sr-only">Compiling...</span>
      </div>
    ),
    []
  )

  const wordCount = manuscript.split(/\s+/).filter(w => w.length > 0).length

  function handleStartFresh() {
    setShowWelcome(false)
    setHasStarted(true)
    setManuscript('')
    setTitle('')
    setTimeout(() => textRef.current?.focus(), 100)
  }

  function handleLoadSample() {
    setShowWelcome(false)
    setHasStarted(true)
    setManuscript(SAMPLE_MD)
    setTitle('Maritime Trade in the 17th Century')
  }

  // Show welcome screen if user hasn't started yet
  if (showWelcome && !hasStarted) {
    return <WelcomeScreen onStart={handleStartFresh} onLoadSample={handleLoadSample} />
  }

  const hasErrors = errors.length > 0 || missingCitations.length > 0 || missingPackages.length > 0

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Editor toolbar */}
      <div className="border-b border-[rgba(255,255,255,0.06)] bg-surface-raised/80 backdrop-blur-sm">
        <div className="container-grid py-3">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            {/* Title input */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled manuscript"
              aria-label="Manuscript title"
              className="input-dark min-w-[200px] max-w-[300px] text-sm font-display font-semibold"
            />

            {/* Right side controls */}
            <div className="flex items-center gap-3 md:ml-auto">
              <StatusPill status={status} />
              <button
                className="btn-pill btn-primary text-sm"
                onClick={() => compile(true)}
                disabled={!manuscript.trim()}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Formatting Controls Panel — visible by default */}
      <div className="container-grid py-3">
        <div className="card p-0 overflow-hidden">
          <button
            onClick={() => setShowFormatting(!showFormatting)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-surface-subtle/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm text-text-primary">Page Setup</span>
              <span className="font-mono text-xs text-text-ghost">
                {TEMPLATE_INFO[template]?.name || template} / {pageSize} / {marginPreset}
              </span>
            </div>
            <svg className={`h-4 w-4 text-text-ghost transition-transform ${showFormatting ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>

          {showFormatting && (
            <div className="p-4 border-t border-[rgba(255,255,255,0.04)]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-text-tertiary" htmlFor="template">Template</label>
                    <TemplateHelp />
                  </div>
                  <select id="template" className="input-dark text-sm" value={template} onChange={(e) => setTemplate(e.target.value as TemplateKey)}>
                    <option value="symphony">Symphony - Classic Academic</option>
                    <option value="chronicle">Chronicle - Editorial Grid</option>
                    <option value="exhibit">Exhibit - Modern Trade</option>
                    <option value="matrix">Matrix - Corporate</option>
                    <option value="avantgarde">Avant-Garde - Creative</option>
                    <option value="chicago">Chicago - Academic Legacy</option>
                    <option value="paperback">Paperback - Trade Legacy</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-tertiary" htmlFor="pageSize">Page size</label>
                  <select id="pageSize" className="input-dark text-sm" value={pageSize} onChange={(e) => setPageSize(e.target.value as PageSize)}>
                    <option value="letter">US Letter (8.5x11&quot;)</option>
                    <option value="a4">A4 (210x297 mm)</option>
                    <option value="sixByNine">Trade 6x9&quot;</option>
                    <option value="fiveFiveByEightFive">Digest 5.5x8.5&quot;</option>
                    <option value="sevenByTen">7x10&quot;</option>
                    <option value="a5">A5 (148x210 mm)</option>
                    <optgroup label="Amazon KDP">
                      <option value="amazonFiveByEight">Amazon 5x8&quot;</option>
                      <option value="amazonSixByNine">Amazon 6x9&quot;</option>
                      <option value="amazonSevenByTen">Amazon 7x10&quot;</option>
                      <option value="amazonEightByTen">Amazon 8x10&quot;</option>
                      <option value="amazonEightFiveByEleven">Amazon 8.5x11&quot;</option>
                    </optgroup>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-text-tertiary" htmlFor="margins">Margins</label>
                  <select id="margins" className="input-dark text-sm" value={marginPreset} onChange={(e) => setMarginPreset(e.target.value as MarginPreset)}>
                    <option value="normal">Normal</option>
                    <option value="narrow">Narrow</option>
                    <option value="wide">Wide</option>
                    <option value="minimal">Minimal</option>
                    <option value="academic">Academic</option>
                    <option value="generous">Generous</option>
                    <option value="compact">Compact</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="compileMode" className="text-xs font-medium text-text-tertiary">Quality</label>
                  <select id="compileMode" className="input-dark text-sm" value={compileMode} onChange={(e) => setCompileMode(e.target.value as CompileMode)}>
                    <option value="fast">Fast preview</option>
                    <option value="full">Full quality (final export)</option>
                  </select>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.04)] flex flex-wrap items-center gap-4">
                <label htmlFor="safeMode" className="inline-flex items-center gap-2 text-xs text-text-tertiary cursor-pointer">
                  <input id="safeMode" type="checkbox" checked={safeMode} onChange={(e) => setSafeMode(e.target.checked)} className="h-3.5 w-3.5 accent-accent rounded" />
                  <span>Safe mode <span className="text-text-ghost">(skip citations)</span></span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-text-tertiary cursor-pointer">
                  <input type="checkbox" className="h-3.5 w-3.5 accent-accent rounded" checked={cleanOnPaste} onChange={(e) => setCleanOnPaste(e.target.checked)} />
                  <span>Auto-clean on paste</span>
                </label>
                <button type="button" className="text-xs text-text-ghost hover:text-text-tertiary underline transition-colors ml-auto" onClick={() => { try { localStorage.removeItem(PREFS_KEY) } catch {} setTemplate('symphony'); setPageSize('sixByNine'); setMarginPreset('normal'); setSafeMode(true); setTitle('') }}>
                  Reset defaults
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="container-grid py-3">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left: Editor */}
          <div className="flex flex-col gap-3">
            <div className="card p-0 overflow-hidden">
              {/* Editor Header */}
              <div className="border-b border-[rgba(255,255,255,0.06)] bg-surface-overlay/50 px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-text-primary">Editor</h3>
                    <span className="font-mono text-xs text-text-ghost">{wordCount} words</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-pill btn-secondary px-3 py-1 text-xs" onClick={() => { setManuscript(SAMPLE_MD); setTitle('Maritime Trade in the 17th Century') }} type="button">Load Sample</button>
                    <button type="button" className="btn-pill btn-secondary px-3 py-1 text-xs" onClick={() => setManuscript(m => cleanFromWord(m))}>Clean Text</button>
                    <button type="button" className="btn-pill btn-primary px-3 py-1 text-xs" onClick={() => { const el = textRef.current; if (!el) return; const n = nextChapterNumber(manuscript); insertAtCursor(el, chapterSkeleton(n, template), setManuscript) }}>+ Chapter</button>
                  </div>
                </div>
              </div>
              {/* Textarea */}
              <div className="relative">
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
                    setTimeout(() => {
                      const pos = start + cleaned.length
                      if (textRef.current) { textRef.current.selectionStart = pos; textRef.current.selectionEnd = pos; textRef.current.focus() }
                    }, 0)
                  }}
                  className="h-[55vh] sm:h-[65vh] w-full resize-vertical p-5 outline-none border-0 bg-surface text-text-primary font-mono text-sm leading-relaxed focus:ring-0 focus:outline-none placeholder:text-text-ghost"
                  placeholder="# My First Chapter&#10;&#10;Paste your manuscript here, or start typing...&#10;&#10;Use **bold** and *italic* for emphasis.&#10;Use # for chapter headings."
                  aria-label="Manuscript editor"
                  style={{ lineHeight: '1.7' }}
                />
              </div>
            </div>

            {/* Error/Status Console — only show when there are issues */}
            {hasErrors && (
              <div className="card p-0 overflow-hidden" role="region" aria-live="polite" aria-label="Issues">
                <div className="border-b border-[rgba(255,255,255,0.06)] bg-surface-overlay/50 px-4 py-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-danger" />
                      <h3 className="text-sm font-semibold text-text-primary">Issues</h3>
                    </div>
                    <button type="button" onClick={downloadDebugBundle} className="text-xs text-text-ghost hover:text-text-tertiary underline transition-colors">Download debug bundle</button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {missingCitations.length > 0 && (
                    <div className="rounded-lg border border-danger/20 bg-danger/5 p-3" role="alert">
                      <div className="font-semibold text-sm text-danger mb-1">Undefined citations</div>
                      <div className="flex flex-wrap gap-2">
                        {missingCitations.map(k => (
                          <span key={k} className="rounded bg-surface-subtle px-2 py-0.5 text-xs text-danger font-mono">[@{k}]</span>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-text-ghost">Enable &ldquo;Safe mode&rdquo; above to skip citation processing.</p>
                    </div>
                  )}
                  {warnings.length > 0 && (
                    <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
                      <div className="font-semibold text-sm text-warning mb-1">Warnings</div>
                      <ul className="list-disc pl-5 text-xs text-text-secondary">
                        {warnings.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  )}
                  {missingPackages.length > 0 && (
                    <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-surface-subtle p-3">
                      <div className="font-semibold text-sm text-text-primary mb-1">Missing LaTeX packages</div>
                      <p className="text-xs text-text-secondary">{missingPackages.join(', ')}</p>
                    </div>
                  )}
                  {errors.map((e, i) => (
                    <div key={i} className="rounded-lg border border-danger/20 bg-danger/5 p-3">
                      <p className="text-xs text-danger">{e.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div className="relative card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-4 py-2">
              <span className="text-xs font-medium text-text-tertiary">Preview</span>
              {pdfUrl && (
                <button onClick={() => compile(true)} className="text-xs text-accent hover:text-accent-hover transition-colors">
                  Download
                </button>
              )}
            </div>
            <div className="relative h-[55vh] sm:h-[70vh] paper-surface">
              {pdfUrl ? (
                <div className="h-full p-4">
                  <iframe title="PDF preview" src={pdfUrl} className="h-full w-full rounded shadow-paper bg-white" />
                </div>
              ) : (
                <div className="grid h-full place-items-center px-6 text-center">
                  <div className="max-w-[240px]">
                    {/* Stylized page placeholder */}
                    <div className="mx-auto mb-6 w-20 h-28 rounded-lg bg-surface-subtle/30 border border-[rgba(255,255,255,0.06)] shadow-inner-subtle flex items-center justify-center">
                      <svg className="w-8 h-8 text-text-ghost/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-text-tertiary font-medium mb-1">
                      {manuscript.trim() ? 'Typesetting your manuscript...' : 'Your PDF preview will appear here'}
                    </p>
                    <p className="text-xs text-text-ghost">
                      {manuscript.trim() ? 'This usually takes a few seconds' : 'Start typing or paste your text on the left'}
                    </p>
                  </div>
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
