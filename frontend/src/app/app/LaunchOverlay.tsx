'use client'

import { useState, useEffect } from 'react'
import { Check, X, AlertTriangle, Download, Lock, Loader2, Package, Shield } from 'lucide-react'
import { createClient, isPocketBaseConfigured } from '@/lib/pocketbase'
import { slug } from './editor-utils'
import type {
  TemplateKey,
  HeadingVariant,
  PageSize,
  MarginPreset,
  CompileMode,
  Platform,
  PaperStock,
  ExportFormat,
  CustomFont,
  PreflightCheck,
  PreflightResult,
  CompileQuality,
} from './editor-types'
import { TEMPLATE_INFO, PAGE_SIZES, hasTier } from './editor-types'

export default function LaunchOverlay({
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
  publisherWindowEnd,
  quality,
  targetPlatform,
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
  publisherWindowEnd: string | null
  quality: CompileQuality
  targetPlatform?: Platform | null
}) {
  const PAPER_STOCK_LABELS: Record<PaperStock, string> = { white: 'white paper', cream: 'cream paper' }
  const [platform, setPlatform] = useState<Platform>(targetPlatform || 'kdp')
  const [paper, setPaper] = useState<PaperStock>('white')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf')
  const [epubLoading, setEpubLoading] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchProgress, setBatchProgress] = useState('')
  const [preflight, setPreflight] = useState<PreflightResult | null>(null)
  const [checking, setChecking] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [contractAccepted, setContractAccepted] = useState(false)
  const [showContract, setShowContract] = useState(false)
  const [qualityAcknowledged, setQualityAcknowledged] = useState(false)
  const [publisherDaysLeft, setPublisherDaysLeft] = useState<number | null>(null)

  // Hydration-safe: compute days remaining only on client
  useEffect(() => {
    if (!publisherWindowEnd || new Date(publisherWindowEnd) <= new Date()) return
    setPublisherDaysLeft(Math.ceil((new Date(publisherWindowEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  }, [publisherWindowEnd])

  // Run real pre-flight when settings change
  useEffect(() => {
    let active = true
    setChecking(true)
    setFetchError(null)
    setPreflight(null)
    setContractAccepted(false)
    setShowContract(false)
    setQualityAcknowledged(false)

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
  const isGradeD = quality?.typographyGrade === 'D'
  const canDownload = !checking && !hasFailure && !fetchError && pdfUrl && (!isGradeD || qualityAcknowledged)

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
        download: true,
      }
      if (customFont) body.customFonts = { main: customFont.fontId }

      // Include auth token for tier/credit checks (same as PDF download)
      const epubHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
      if (isPocketBaseConfigured) {
        const pb = createClient()
        if (pb.authStore.isValid && pb.authStore.token) {
          epubHeaders['Authorization'] = `Bearer ${pb.authStore.token}`
        }
      }

      const resp = await fetch('/api/compile', {
        method: 'POST',
        headers: epubHeaders,
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
        download: true,
      }
      if (customFont) body.customFonts = { main: customFont.fontId }

      // Include auth token for tier/credit checks
      const batchHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
      if (isPocketBaseConfigured) {
        const pb = createClient()
        if (pb.authStore.isValid && pb.authStore.token) {
          batchHeaders['Authorization'] = `Bearer ${pb.authStore.token}`
        }
      }

      const resp = await fetch('/api/batch-compile', {
        method: 'POST',
        headers: batchHeaders,
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
                    <span className="inline-block h-3 w-3 shrink-0 text-center font-mono text-[10px] text-[#111111]/50">·</span>

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#FDFCF8]/80 backdrop-blur-md animate-fade-in"
    >
      <div
        className="w-full max-w-xl px-6 animate-fade-in-up"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[#111111]">Export &amp; Publish</h2>
          <button onClick={onBack} className="flex h-8 w-8 items-center justify-center bg-[#111111]/[0.06] text-[#111111]/50 transition-colors hover:bg-[#111111]/[0.1] hover:text-[#111111]/70">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Left column: export settings */}
          <div className="space-y-3">
            {/* Platform selector */}
            <div className="border border-[#111111]/[0.12] bg-white p-4">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/50">Target Platform</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPlatform('kdp')}
                  className={`flex-1 py-2 text-[11px] font-semibold transition-all ${
                    platform === 'kdp'
                      ? 'bg-[#111111] text-white'
                      : 'border border-[#111111]/[0.12] text-[#111111]/60 hover:border-[#111111]/25'
                  }`}
                >
                  Amazon KDP
                </button>
                <button
                  onClick={() => hasTier(userTier, 'publisher') && setPlatform('ingram')}
                  className={`flex-1 py-2 text-[11px] font-semibold transition-all ${
                    platform === 'ingram'
                      ? 'bg-[#FF3333] text-white'
                      : 'border border-[#111111]/[0.12] text-[#111111]/60 hover:border-[#111111]/25'
                  } ${!hasTier(userTier, 'publisher') ? 'opacity-40 cursor-not-allowed' : ''}`}
                  title={!hasTier(userTier, 'publisher') ? 'PDF/X-1a requires Publisher or Studio' : ''}
                >
                  IngramSpark {!hasTier(userTier, 'publisher') && <Lock className="ml-1 inline h-2.5 w-2.5" />}
                </button>
              </div>
              <p className="mt-2 font-mono text-[10px] leading-relaxed text-[#111111]/50">
                {platform === 'kdp'
                  ? 'Standard PDF with KDP spine and gutter calculations. Upload directly to your KDP dashboard.'
                  : 'PDF/X-1a with CMYK color profile and bleed marks. Required by IngramSpark, also works for offset printing.'}
              </p>
            </div>

            {/* Paper stock selector */}
            <div className="border border-[#111111]/[0.12] bg-white p-4">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/50">Paper Stock</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaper('white')}
                  className={`flex-1 py-2 text-[11px] font-medium transition-all ${
                    paper === 'white'
                      ? 'bg-[#111111] text-white'
                      : 'border border-[#111111]/[0.12] text-[#111111]/60 hover:border-[#111111]/25'
                  }`}
                >
                  White
                </button>
                <button
                  onClick={() => setPaper('cream')}
                  className={`flex-1 py-2 text-[11px] font-medium transition-all ${
                    paper === 'cream'
                      ? 'bg-[#f5f0d0] text-[#111111]'
                      : 'border border-[#111111]/[0.12] text-[#111111]/60 hover:border-[#111111]/25'
                  }`}
                >
                  Cream
                </button>
              </div>
            </div>
          </div>

          {/* Right column: pre-flight terminal */}
          <div className="flex flex-col overflow-hidden border border-[#111111]/[0.12] bg-white">
            {/* Terminal chrome */}
            <div className="flex items-center gap-2 border-b border-[#111111]/[0.10] bg-[#111111]/[0.02] px-4 py-2.5">
              <div className={`h-2 w-2 rounded-full ${
                checking ? 'bg-amber-500 animate-pulse'
                : fetchError || hasFailure ? 'bg-red-500'
                : 'bg-emerald-500'
              }`} />
              <span className="font-mono text-[10px] text-[#111111]/50">
                PRE-FLIGHT // {platform.toUpperCase()}
              </span>
            </div>

            {/* Check results */}
            <div className="flex-1 p-4 font-mono text-[11px] leading-[1.9]">
              {checking ? (
                <div className="flex items-center gap-2 text-[#111111]/50">
                  <div className="h-3 w-3 animate-spin rounded-full border border-[#111111]/25 border-t-transparent" />
                  Running pre-flight analysis...
                </div>
              ) : fetchError ? (
                <div className="text-red-500/70">[ERROR] {fetchError}</div>
              ) : preflight ? (
                preflight.checks.map((check, i) => (
                  <div
                    key={i}
                    className="mb-1.5 animate-fade-in"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5">{statusIcon(check.status)}</span>
                      <div>
                        <span className={
                          check.status === 'pass' ? 'text-[#111111]/50' :
                          check.status === 'fail' ? 'text-red-600/90' :
                          check.status === 'warn' ? 'text-amber-600/80' :
                          'text-[#111111]/55'
                        }>
                          {check.name}
                        </span>
                        <p className="text-[10px] text-[#111111]/55">{check.detail}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : null}
            </div>

            {/* Real stats from backend */}
            {!checking && preflight && (
              <>
                <div className={`grid gap-px border-t border-[#111111]/[0.10] bg-[#111111]/[0.03] ${quality?.typographyGrade ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  <div className="bg-white p-2.5 text-center">
                    <p className="font-mono text-[8px] uppercase tracking-wider text-[#111111]/55">Pages</p>
                    <p className="font-display text-sm font-bold text-[#111111]">~{preflight.stats.estimatedPages}</p>
                  </div>
                  <div className="bg-white p-2.5 text-center">
                    <p className="font-mono text-[8px] uppercase tracking-wider text-[#111111]/55">Spine</p>
                    <p className="font-display text-sm font-bold text-[#111111]">{preflight.stats.spineInches}&quot;</p>
                  </div>
                  <div className="bg-white p-2.5 text-center">
                    <p className="font-mono text-[8px] uppercase tracking-wider text-[#111111]/55">Trim</p>
                    <p className="font-display text-sm font-bold text-[#111111]">{preflight.stats.trimWidth}&times;{preflight.stats.trimHeight}&quot;</p>
                  </div>
                  {quality?.typographyGrade && (
                    <div className="bg-white p-2.5 text-center">
                      <p className="font-mono text-[8px] uppercase tracking-wider text-[#111111]/55">Quality</p>
                      <p className={`font-display text-sm font-bold ${
                        quality.typographyGrade === 'A' ? 'text-emerald-600' :
                        quality.typographyGrade === 'B' ? 'text-[#111111]' :
                        quality.typographyGrade === 'C' ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {quality.typographyGrade}
                      </p>
                    </div>
                  )}
                </div>
                {quality?.engine && (
                  <div className="border-t border-[#111111]/[0.10] bg-white px-4 py-1.5 text-center">
                    <span className="font-mono text-[8px] uppercase tracking-wider text-[#111111]/50">Engine: {quality.engine}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Format selector */}
        <div className="mt-4 mb-3 flex bg-[#111111]/[0.03] p-0.5">
          {(['pdf', 'epub'] as ExportFormat[]).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setExportFormat(fmt)}
              className={`flex-1 px-3 py-2 text-center text-[11px] font-medium transition-all duration-150 ${
                exportFormat === fmt
                  ? 'bg-[#111111]/[0.08] text-[#111111]'
                  : 'text-[#111111]/60 hover:text-[#111111]/80'
              }`}
            >
              {fmt === 'pdf' ? 'PDF' : (<span className="inline-flex items-center gap-1">EPUB{!hasTier(userTier, 'studio') && <Lock className="h-2.5 w-2.5 opacity-40" />}</span>)}
            </button>
          ))}
        </div>

        {/* Acceptance Contract — shown before paid downloads */}
        {showContract && preflight && !hasFailure && (
          <div className="mt-3 border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div className="flex-1">
                <p className="font-display text-[13px] font-semibold text-[#111111]">
                  Preflight Passed
                </p>
                <p className="mt-1 font-body text-[12px] leading-relaxed text-[#111111]/60">
                  This manuscript meets {platform === 'kdp' ? 'Amazon KDP Paperback' : 'IngramSpark'} specifications.
                  All {preflight.checks.filter(c => c.status === 'pass').length} checks passed.
                  Output: ~{preflight.stats.estimatedPages} pages, {preflight.stats.trimWidth}&times;{preflight.stats.trimHeight}&quot; trim,
                  {' '}{preflight.stats.spineInches}&quot; spine ({PAPER_STOCK_LABELS[paper]}).
                  {quality?.typographyGrade && (
                    <> Typography grade: <strong>{quality.typographyGrade}</strong>{quality.typographyScore !== null ? ` (${quality.typographyScore}/100)` : ''}.</>
                  )}
                  {quality && (quality.overfullBoxes > 0 || quality.underfullBoxes > 0) && (
                    <> Layout warnings: {quality.overfullBoxes > 0 ? `${quality.overfullBoxes} overfull` : ''}{quality.overfullBoxes > 0 && quality.underfullBoxes > 0 ? ', ' : ''}{quality.underfullBoxes > 0 ? `${quality.underfullBoxes} underfull` : ''}.</>
                  )}
                </p>
                <label className="mt-3 flex cursor-pointer items-start gap-2.5">
                  <input
                    id="preflight-accept"
                    type="checkbox"
                    checked={contractAccepted}
                    onChange={(e) => setContractAccepted(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 accent-emerald-600"
                  />
                  <span className="font-mono text-[10px] leading-relaxed text-[#111111]/50">
                    I accept this preflight report and authorize the export.
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Quality warning — shown when typography grade is C or D */}
        {!checking && quality?.typographyGrade && (quality.typographyGrade === 'C' || quality.typographyGrade === 'D') && (
          <div className={`mt-3 border px-4 py-3 ${
            quality.typographyGrade === 'D'
              ? 'border-red-500/20 bg-red-500/[0.04]'
              : 'border-amber-500/20 bg-amber-500/[0.04]'
          }`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${
                quality.typographyGrade === 'D' ? 'text-red-500/70' : 'text-amber-600/70'
              }`} />
              <div className="flex-1">
                <p className={`font-mono text-[11px] font-semibold ${
                  quality.typographyGrade === 'D' ? 'text-red-800/80' : 'text-amber-800/80'
                }`}>
                  {quality.typographyGrade === 'D' ? 'Low Typography Quality' : 'Typography Needs Attention'}
                </p>
                <p className={`mt-1 font-mono text-[10px] leading-relaxed ${
                  quality.typographyGrade === 'D' ? 'text-red-700/60' : 'text-amber-700/60'
                }`}>
                  {quality.typographyGrade === 'D'
                    ? 'This layout has significant typography issues that may produce a poor reading experience. Consider adjusting margins, page size, or template before exporting.'
                    : 'Some typography metrics are below ideal. The PDF is usable, but adjusting margins or template may improve readability.'
                  }
                  {quality.overfullBoxes > 0 && ` ${quality.overfullBoxes} overfull line${quality.overfullBoxes > 1 ? 's' : ''} detected.`}
                </p>
                {quality.typographyGrade === 'D' && (
                  <label className="mt-2.5 flex cursor-pointer items-start gap-2.5">
                    <input
                      id="quality-acknowledge"
                      type="checkbox"
                      checked={qualityAcknowledged}
                      onChange={(e) => setQualityAcknowledged(e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 accent-red-600"
                    />
                    <span className="font-mono text-[10px] leading-relaxed text-red-700/50">
                      I understand the typography quality is below recommended thresholds.
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Download buttons */}
        <div className="mt-3 space-y-2">
          {exportFormat === 'pdf' ? (
            (() => {
              // Paid users see the contract gate; free/watermarked users download directly
              const isPaidDownload = hasTier(userTier, 'publisher')
              if (isPaidDownload && !showContract) {
                return (
                  <button
                    onClick={() => setShowContract(true)}
                    disabled={!canDownload}
                    className="group inline-flex h-12 w-full items-center justify-center gap-2.5 bg-[#FF3333] font-display text-[14px] font-semibold text-white transition-all hover:bg-[#E52222] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Shield className="h-4 w-4" />
                    Review Preflight &amp; Download
                  </button>
                )
              }
              if (isPaidDownload && showContract) {
                return (
                  <button
                    onClick={() => onDownload(platform)}
                    disabled={!canDownload || !contractAccepted}
                    className="group inline-flex h-12 w-full items-center justify-center gap-2.5 bg-emerald-600 font-display text-[14px] font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Download className="h-4 w-4" />
                    {contractAccepted ? 'Download — Contract Accepted' : 'Accept Contract to Download'}
                  </button>
                )
              }
              return (
                <button
                  onClick={() => onDownload(platform)}
                  disabled={!canDownload}
                  className="group inline-flex h-12 w-full items-center justify-center gap-2.5 bg-[#FF3333] font-display text-[14px] font-semibold text-white transition-all hover:bg-[#E52222] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  Download Preview PDF (Watermarked)
                </button>
              )
            })()
          ) : !hasTier(userTier, 'studio') ? (
            <a
              href="/pricing"
              className="group inline-flex h-12 w-full items-center justify-center gap-2.5 border border-[#111111]/[0.16] font-display text-[13px] font-medium text-[#111111]/60 transition-all hover:border-[#111111]/25 hover:text-[#111111]/80"
            >
              <Lock className="h-4 w-4" />EPUB — Studio Only
            </a>
          ) : (
            <button
              onClick={handleEpubDownload}
              disabled={epubLoading}
              className="group inline-flex h-12 w-full items-center justify-center gap-2.5 bg-[#FF3333] font-display text-[14px] font-semibold text-white transition-all hover:bg-[#E52222] disabled:opacity-50"
            >
              {epubLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Generating EPUB&hellip;</>
              ) : (
                <><Download className="h-4 w-4" />Download EPUB</>
              )}
            </button>
          )}

          {/* Batch export — Studio only */}
          {!hasTier(userTier, 'studio') ? (
            <a
              href="/pricing"
              className="group inline-flex h-10 w-full items-center justify-center gap-2 border border-[#111111]/[0.12] text-[12px] font-medium text-[#111111]/50 transition-all hover:border-[#111111]/25 hover:text-[#111111]/70"
            >
              <Lock className="h-3.5 w-3.5" />Batch Export — Studio Only
            </a>
          ) : (
            <button
              onClick={handleBatchExport}
              disabled={batchLoading || !pdfUrl}
              className="group inline-flex h-10 w-full items-center justify-center gap-2 border border-[#111111]/[0.12] text-[12px] font-medium text-[#111111]/60 transition-all hover:border-[#111111]/25 hover:text-[#111111]/80 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {batchLoading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" />{batchProgress || 'Batch exporting...'}</>
              ) : (
                <><Package className="h-3.5 w-3.5" />Batch Export — All Sizes (ZIP)</>
              )}
            </button>
          )}
        </div>

        {/* Failure message — blocks export */}
        {exportFormat === 'pdf' && !checking && hasFailure && (
          <div className="mt-3 border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-center">
            <p className="font-mono text-[10px] font-medium text-red-600">
              Export blocked — one or more preflight checks failed. Fix the issues above.
            </p>
          </div>
        )}

        {/* Pre-download transparency gate — clearly explains what free tier gets */}
        {!hasTier(userTier, 'publisher') && exportFormat === 'pdf' && (
          <div className="mt-3 border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600/70" />
              <div>
                <p className="font-mono text-[11px] font-semibold text-amber-800/80">
                  Free Preview — Watermark Included
                </p>
                <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-amber-700/60">
                  This PDF includes a light watermark on every page. It&apos;s designed for
                  proofing your layout, not for uploading to KDP or IngramSpark.
                </p>
                <div className="mt-2.5 flex items-center gap-4">
                  <a
                    href="/pricing"
                    className="inline-flex h-7 items-center bg-amber-600 px-4 font-mono text-[10px] uppercase tracking-[0.08em] text-white transition-colors hover:bg-amber-700"
                  >
                    Remove watermark — $19.99
                  </a>
                  <span className="font-mono text-[9px] text-amber-700/40">
                    One manuscript &middot; 14-day re-export window
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Post-download watermark confirmation */}
        {lastDownloadWatermarked && hasTier(userTier, 'publisher') && (
          <div className="mt-3 border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2 text-center">
            <p className="font-mono text-[10px] text-amber-700/70">
              This export included a watermark.{' '}
              <a href="/pricing" className="underline hover:text-amber-800">Upgrade</a> for clean exports.
            </p>
          </div>
        )}
        {publisherWindowEnd && new Date(publisherWindowEnd) > new Date() && (
          <p className="mt-2 text-center font-mono text-[10px] text-emerald-600/60" suppressHydrationWarning>
            Publisher window active{publisherDaysLeft !== null ? ` — ${publisherDaysLeft} day${publisherDaysLeft !== 1 ? 's' : ''} remaining` : ''}
          </p>
        )}

        <p className="mt-3 text-center font-mono text-[10px] text-[#111111]/50">
          {TEMPLATE_INFO[template]?.name} / {PAGE_SIZES[pageSize]?.label} / {title || 'Untitled'}
          {quality?.buildId && <> / {quality.buildId.slice(0, 20)}</>}
        </p>
      </div>
    </div>
  )
}
