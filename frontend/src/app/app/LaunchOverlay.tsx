'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, X, AlertTriangle, Download, Lock, Loader2, Package, Shield } from 'lucide-react'
import { createClient, isPocketBaseConfigured } from '@/lib/supabase'
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
} from './editor-types'
import { TEMPLATE_INFO, PAGE_SIZES, ease, hasTier } from './editor-types'

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
}) {
  const PAPER_STOCK_LABELS: Record<PaperStock, string> = { white: 'white paper', cream: 'cream paper' }
  const [platform, setPlatform] = useState<Platform>('kdp')
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

  // Run real pre-flight when settings change
  useEffect(() => {
    let active = true
    setChecking(true)
    setFetchError(null)
    setPreflight(null)
    setContractAccepted(false)
    setShowContract(false)

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
                  onClick={() => hasTier(userTier, 'publisher') && setPlatform('ingram')}
                  className={`flex-1 rounded-lg py-2 text-[11px] font-semibold transition-all ${
                    platform === 'ingram'
                      ? 'bg-[#FF3333] text-white'
                      : 'border border-[#111111]/[0.08] text-[#111111]/40 hover:border-[#111111]/20'
                  } ${!hasTier(userTier, 'publisher') ? 'opacity-40 cursor-not-allowed' : ''}`}
                  title={!hasTier(userTier, 'publisher') ? 'PDF/X-1a requires Publisher or Studio' : ''}
                >
                  IngramSpark {!hasTier(userTier, 'publisher') && <Lock className="ml-1 inline h-2.5 w-2.5" />}
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
              {fmt === 'pdf' ? 'PDF' : (<span className="inline-flex items-center gap-1">EPUB{!hasTier(userTier, 'studio') && <Lock className="h-2.5 w-2.5 opacity-40" />}</span>)}
            </button>
          ))}
        </div>

        {/* Acceptance Contract — shown before paid downloads */}
        {showContract && preflight && !hasFailure && (
          <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
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
                </p>
                <label className="mt-3 flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={contractAccepted}
                    onChange={(e) => setContractAccepted(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded accent-emerald-600"
                  />
                  <span className="font-mono text-[10px] leading-relaxed text-[#111111]/50">
                    I accept this preflight report and authorize the export.
                  </span>
                </label>
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
              className="group inline-flex h-12 w-full items-center justify-center gap-2.5 border border-[#111111]/[0.12] font-display text-[13px] font-medium text-[#111111]/40 transition-all hover:border-[#111111]/20 hover:text-[#111111]/60"
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
              className="group inline-flex h-10 w-full items-center justify-center gap-2 border border-[#111111]/[0.08] text-[12px] font-medium text-[#111111]/25 transition-all hover:border-[#111111]/15 hover:text-[#111111]/40"
            >
              <Lock className="h-3.5 w-3.5" />Batch Export — Studio Only
            </a>
          ) : (
            <button
              onClick={handleBatchExport}
              disabled={batchLoading || !pdfUrl}
              className="group inline-flex h-10 w-full items-center justify-center gap-2 border border-[#111111]/[0.08] text-[12px] font-medium text-[#111111]/40 transition-all hover:border-[#111111]/20 hover:text-[#111111]/60 disabled:opacity-30 disabled:cursor-not-allowed"
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
          <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-center">
            <p className="font-mono text-[10px] font-medium text-red-600">
              Export blocked — one or more preflight checks failed. Fix the issues above.
            </p>
          </div>
        )}

        {/* Pre-download watermark notice — visible before download for free tier */}
        {!hasTier(userTier, 'publisher') && exportFormat === 'pdf' && (
          <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2.5 text-center">
            <p className="font-mono text-[10px] font-medium text-amber-700/80">
              Free tier — exported PDF will include a watermark.
            </p>
            <p className="mt-1 font-mono text-[10px] text-amber-700/50">
              <a href="/pricing" className="underline hover:text-amber-800">Upgrade to Publisher</a> for clean, print-ready exports.
            </p>
          </div>
        )}
        {/* Post-download watermark confirmation */}
        {lastDownloadWatermarked && hasTier(userTier, 'publisher') && (
          <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2 text-center">
            <p className="font-mono text-[10px] text-amber-700/70">
              This export included a watermark.{' '}
              <a href="/pricing" className="underline hover:text-amber-800">Upgrade</a> for clean exports.
            </p>
          </div>
        )}
        {publisherWindowEnd && new Date(publisherWindowEnd) > new Date() && (
          <p className="mt-2 text-center font-mono text-[10px] text-emerald-600/60">
            Publisher window active — {Math.ceil((new Date(publisherWindowEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} day{Math.ceil((new Date(publisherWindowEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) !== 1 ? 's' : ''} remaining
          </p>
        )}

        <p className="mt-3 text-center font-mono text-[10px] text-[#111111]/25">
          {TEMPLATE_INFO[template]?.name} / {PAGE_SIZES[pageSize]?.label} / {title || 'Untitled'}
        </p>
      </motion.div>
    </motion.div>
  )
}
