'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, FileText, RotateCcw, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'

import type { Status, CompileError, CompileQuality, CompileDebug, ViewMode } from './editor-types'
import { ease } from './editor-types'
import { translateError, suggestFix } from './editor-utils'

/* ═══════════════════════════════════════════════════════════════════
   SKELETON LOADER — SVG wireframe shown during typesetting
   ═══════════════════════════════════════════════════════════════════ */

function BookSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white">
      <div className="relative h-[520px] w-[380px]">
        <div className="absolute inset-0 bg-[#f5f5f0] border border-[#e5e5e0]" />
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF3333]/40 to-transparent"
          initial={{ top: '10%' }}
          animate={{ top: '90%' }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
        <div className="absolute inset-x-[15%] top-[12%] space-y-3">
          <div className="h-4 w-3/5 bg-[#e5e5e0]" />
          <div className="h-2 w-4/5 bg-[#f5f5f0]" />
          <div className="mt-6 space-y-2">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="h-1.5 bg-[#f5f5f0]" style={{ width: `${70 + Math.sin(i * 1.3) * 20}%` }} />
            ))}
          </div>
        </div>
        <p className="absolute bottom-[8%] left-0 right-0 text-center font-mono text-[10px] text-[#111111]/50">
          Typesetting...
        </p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   QUALITY BADGE — Typography score shown after successful compile
   ═══════════════════════════════════════════════════════════════════ */

function QualityBadge({ quality }: { quality: CompileQuality }) {
  if (!quality || quality.typographyGrade === null) return null

  const gradeColor = {
    'A': 'text-emerald-600 border-emerald-500/20 bg-emerald-500/[0.06]',
    'B': 'text-blue-600 border-blue-500/20 bg-blue-500/[0.06]',
    'C': 'text-amber-600 border-amber-500/20 bg-amber-500/[0.06]',
    'D': 'text-red-600 border-red-500/20 bg-red-500/[0.06]',
  }[quality.typographyGrade] || 'text-[#111111]/60 border-[#e5e5e0] bg-[#f5f5f0]'

  const hasWarnings = quality.overfullBoxes > 0 || quality.underfullBoxes > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="absolute top-2 right-2 z-20 flex flex-wrap items-center gap-1 sm:top-3 sm:right-3 sm:gap-2"
    >
      <div className={`flex items-center gap-1.5 border px-2 py-1 ${gradeColor}`}>
        <span className="font-mono text-[9px] uppercase tracking-wider opacity-60">Typography</span>
        <span className="font-mono text-[11px] font-bold">{quality.typographyGrade}</span>
      </div>
      {hasWarnings && (
        <div className="flex items-center gap-1 border border-amber-500/20 bg-amber-500/[0.06] px-2 py-1">
          <AlertTriangle className="h-2.5 w-2.5 text-amber-500/60" />
          <span className="font-mono text-[9px] text-amber-600/60">
            {quality.overfullBoxes > 0 && `${quality.overfullBoxes} overfull`}
            {quality.overfullBoxes > 0 && quality.underfullBoxes > 0 && ', '}
            {quality.underfullBoxes > 0 && `${quality.underfullBoxes} underfull`}
          </span>
        </div>
      )}
      {quality.engine && (
        <div className="border border-[#e5e5e0] bg-[#f5f5f0] px-2 py-1" title={quality.engine}>
          <span className="font-mono text-[8px] text-[#111111]/50">{quality.engine}</span>
        </div>
      )}
      {quality.buildId && (
        <div className="border border-[#e5e5e0] bg-[#f5f5f0] px-2 py-1" title={quality.buildId}>
          <span className="font-mono text-[8px] text-[#111111]/50">{quality.buildId.slice(0, 20)}</span>
        </div>
      )}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   ERROR PANEL — Differentiates expired previews from compile failures
   ═══════════════════════════════════════════════════════════════════ */

function ErrorPanel({ errors, debug, onRetry }: { errors: CompileError[]; debug?: CompileDebug; onRetry?: () => void }) {
  const isExpired = errors.some(e => e.isSoft) || (
    !errors.some(e => e.isSoft === false) &&
    errors.some(e =>
      /expired|not found|recompile|try again/i.test(e.message) && !/failed|error|missing/i.test(e.message)
    )
  )

  const visibleErrors = errors.filter(e => !e.message.startsWith('__detail__'))
  const firstFix = (() => {
    const structured = visibleErrors.find(e => e.fix)
    if (structured?.fix) return structured.fix
    const legacy = visibleErrors.find(e => suggestFix(e.message))
    return legacy ? suggestFix(legacy.message) : null
  })()

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#FDFCF8] p-4 sm:p-8">
      <div className="w-full max-w-[420px]">
        <div className={`mb-4 flex h-10 w-10 items-center justify-center border ${isExpired ? 'border-amber-500/20 bg-amber-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
          {isExpired
            ? <RotateCcw className="h-4 w-4 text-amber-500/60" />
            : <AlertTriangle className="h-4 w-4 text-red-500/60" />}
        </div>
        <p className={`mb-3 font-mono text-[11px] font-medium uppercase tracking-wider ${isExpired ? 'text-amber-600/70' : 'text-red-600/70'}`}>
          {isExpired ? 'Preview Expired' : 'Typesetting Error'}
        </p>
        {visibleErrors.map((e, i) => (
          <p key={i} className="mb-1.5 break-words font-mono text-[11px] leading-relaxed text-[#111111]/80">{translateError(e.message)}</p>
        ))}
        {!isExpired && firstFix && (
          <div className="mt-3 flex items-start gap-2 border-l-2 border-[#FF3333]/30 bg-[#f5f5f0] px-3 py-2">
            <span className="font-mono text-[10px] leading-relaxed text-[#111111]/70">
              Try: {firstFix}
            </span>
          </div>
        )}
        {errors.some(e => e.message.startsWith('__detail__')) && (
          <details className="mt-4">
            <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-wider text-[#111111]/50 transition-colors hover:text-[#111111]/60">
              Engine log
            </summary>
            <pre className="mt-2 max-h-[200px] overflow-auto whitespace-pre-wrap break-all border border-[#e5e5e0] bg-[#f5f5f0] p-3 font-mono text-[9px] leading-relaxed text-[#111111]/60">
              {errors.filter(e => e.message.startsWith('__detail__')).map(e => e.message.replace('__detail__', '')).join('\n')}
            </pre>
          </details>
        )}
        {debug?.latexLog && (
          <details className="mt-2">
            <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-wider text-[#111111]/50 transition-colors hover:text-[#111111]/60">
              Full engine log
            </summary>
            <pre className="mt-2 max-h-[300px] overflow-auto whitespace-pre-wrap break-all border border-[#e5e5e0] bg-[#f5f5f0] p-3 font-mono text-[9px] leading-relaxed text-[#111111]/60">
              {debug.latexLog}
            </pre>
          </details>
        )}
        {debug?.texSource && (
          <details className="mt-2">
            <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-wider text-[#111111]/50 transition-colors hover:text-[#111111]/60">
              Generated Typst source
            </summary>
            <pre className="mt-2 max-h-[300px] overflow-auto whitespace-pre-wrap break-all border border-[#e5e5e0] bg-[#f5f5f0] p-3 font-mono text-[9px] leading-relaxed text-[#111111]/60">
              {debug.texSource}
            </pre>
          </details>
        )}
        {debug?.headerTex && (
          <details className="mt-2">
            <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-wider text-[#111111]/50 transition-colors hover:text-[#111111]/60">
              Injected preamble (header.tex)
            </summary>
            <pre className="mt-2 max-h-[300px] overflow-auto whitespace-pre-wrap break-all border border-[#e5e5e0] bg-[#f5f5f0] p-3 font-mono text-[9px] leading-relaxed text-[#111111]/60">
              {debug.headerTex}
            </pre>
          </details>
        )}
        {debug?.filesInDir && debug.filesInDir.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-wider text-[#111111]/50 transition-colors hover:text-[#111111]/60">
              Files in compile directory
            </summary>
            <pre className="mt-2 max-h-[150px] overflow-auto whitespace-pre-wrap break-all border border-[#e5e5e0] bg-[#f5f5f0] p-3 font-mono text-[9px] leading-relaxed text-[#111111]/60">
              {debug.filesInDir.join('\n')}
            </pre>
          </details>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className={`mt-4 inline-flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              isExpired
                ? 'border-[#FF3333] bg-[#FF3333] text-white hover:bg-[#E52222]'
                : 'border-[#111111]/20 bg-white text-[#111111]/70 hover:border-[#111111]/40 hover:text-[#111111]'
            }`}
          >
            <RotateCcw className="h-3 w-3" />
            {isExpired ? 'Recompile' : 'Retry'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SVG PAGE — Renders inline SVG from memory (no network request)
   Strips Typst's fixed width/height attributes so the viewBox controls
   aspect ratio and CSS handles responsive scaling.
   ═══════════════════════════════════════════════════════════════════ */

function SvgPage({
  svg,
  className,
}: {
  svg: string
  className?: string
}) {
  const responsiveSvg = useMemo(() => {
    // Remove fixed width="Xpt" and height="Ypt" from the root <svg> element.
    // Keep the viewBox attribute — it defines the coordinate system and aspect ratio.
    // CSS then sizes the SVG to fill its container height with auto width.
    return svg
      .replace(/(<svg\b)([^>]*?)\s+width="[^"]*"/, '$1$2')
      .replace(/(<svg\b)([^>]*?)\s+height="[^"]*"/, '$1$2')
  }, [svg])

  return (
    <div
      className={`h-full overflow-hidden [&>svg]:block [&>svg]:h-full [&>svg]:w-auto ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: responsiveSvg }}
    />
  )
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE VIEWER — Renders SVG pages in single or spread layout
   ═══════════════════════════════════════════════════════════════════ */

function PageViewer({
  svgPages,
  viewMode,
}: {
  svgPages: string[]
  viewMode: ViewMode
}) {
  const pageCount = svgPages.length
  const [currentPage, setCurrentPage] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset to page 1 when pages change
  useEffect(() => { setCurrentPage(1) }, [svgPages])

  const goNext = useCallback(() => {
    const step = viewMode === 'spread' ? 2 : 1
    setCurrentPage(p => Math.min(p + step, pageCount))
  }, [viewMode, pageCount])

  const goPrev = useCallback(() => {
    const step = viewMode === 'spread' ? 2 : 1
    setCurrentPage(p => Math.max(p - step, 1))
  }, [viewMode])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); goPrev() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goNext, goPrev])

  const isSpread = viewMode === 'spread'
  const hasPrev = currentPage > 1
  const hasNext = isSpread ? currentPage + 1 < pageCount : currentPage < pageCount

  // In spread mode: left page (verso) = currentPage, right page (recto) = currentPage + 1
  // First page (title page) shows alone on the right side of the spread
  const isFirstPage = currentPage === 1
  const showLeftPage = isSpread && !isFirstPage
  const leftPage = isSpread ? currentPage : 0
  const rightPage = isSpread ? (isFirstPage ? 1 : currentPage + 1) : currentPage
  const showRightPage = rightPage <= pageCount

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col items-center justify-center">
      {/* Page display area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {isSpread ? (
          /* ── Spread view: two pages side by side ── */
          <div className="flex h-full items-center justify-center gap-0">
            {/* Left (verso) page */}
            <div
              className="relative flex h-full items-center justify-end"
              style={{ maxWidth: '45%' }}
            >
              {showLeftPage ? (
                <div className="relative h-[90%] bg-white" style={{ boxShadow: '-2px 2px 12px rgba(0,0,0,0.08)', border: '1px solid #e5e5e0' }}>
                  <SvgPage svg={svgPages[leftPage - 1]} className="h-full" />
                </div>
              ) : (
                /* Empty verso for title page spread */
                <div className="h-[90%] bg-[#f5f5f0]" style={{ aspectRatio: '0.707', border: '1px solid #e5e5e0' }} />
              )}
            </div>

            {/* Spine shadow */}
            <div
              className="relative z-10 h-[90%] w-[3px]"
              style={{
                background: 'linear-gradient(to right, rgba(0,0,0,0.12), rgba(0,0,0,0.03), rgba(0,0,0,0.12))',
              }}
            />

            {/* Right (recto) page */}
            <div
              className="relative flex h-full items-center justify-start"
              style={{ maxWidth: '45%' }}
            >
              {showRightPage ? (
                <div className="relative h-[90%] bg-white" style={{ boxShadow: '2px 2px 12px rgba(0,0,0,0.08)', border: '1px solid #e5e5e0' }}>
                  <SvgPage svg={svgPages[rightPage - 1]} className="h-full" />
                </div>
              ) : (
                /* Empty recto if odd page count */
                <div className="h-[90%] bg-[#f5f5f0]" style={{ aspectRatio: '0.707', border: '1px solid #e5e5e0' }} />
              )}
            </div>
          </div>
        ) : (
          /* ── Single page view ── */
          <div className="relative h-[90%] max-h-[780px] bg-white" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 12px 40px -8px rgba(0,0,0,0.12)', border: '1px solid #e5e5e0' }}>
            <SvgPage svg={svgPages[currentPage - 1]} className="h-full" />
          </div>
        )}
      </div>

      {/* Page navigation bar */}
      <div className="flex h-10 shrink-0 items-center justify-center gap-4">
        <button
          onClick={goPrev}
          disabled={!hasPrev}
          className="flex h-7 w-7 items-center justify-center text-[#111111]/50 transition-colors hover:text-[#111111] disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="font-mono text-[10px] tabular-nums text-[#111111]/60">
          {isSpread ? (
            isFirstPage
              ? `1 of ${pageCount}`
              : showRightPage
                ? `${leftPage}–${rightPage} of ${pageCount}`
                : `${leftPage} of ${pageCount}`
          ) : (
            `${currentPage} of ${pageCount}`
          )}
        </span>
        <button
          onClick={goNext}
          disabled={!hasNext}
          className="flex h-7 w-7 items-center justify-center text-[#111111]/50 transition-colors hover:text-[#111111] disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   PREVIEW PANE — The PDF preview sits center-screen
   Renders SVG pages when available, falls back to PDF iframe
   ═══════════════════════════════════════════════════════════════════ */

export default function PreviewPane({
  pdfUrl,
  loading,
  status,
  errors,
  debug,
  isWatermarked,
  quality,
  svgPages,
  viewMode,
  onViewModeChange,
  onRetry,
}: {
  pdfUrl: string | null
  loading: boolean
  status: Status
  errors: CompileError[]
  debug?: CompileDebug
  isWatermarked: boolean
  quality?: CompileQuality
  svgPages: string[]
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onRetry?: () => void
}) {
  const useSvg = svgPages.length > 0 && status === 'success'

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* View mode toggle — only shown when we have SVG pages */}
      {pdfUrl && status === 'success' && svgPages.length > 0 && (
        <div className="flex h-8 shrink-0 items-center justify-center gap-1 border-b border-[#e5e5e0] bg-[#FDFCF8]">
          <button
            onClick={() => onViewModeChange('single')}
            className={`flex items-center gap-1 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors ${
              viewMode === 'single'
                ? 'text-[#111111] bg-[#111111]/5'
                : 'text-[#111111]/40 hover:text-[#111111]/60'
            }`}
          >
            <FileText className="h-3 w-3" />
            Single
          </button>
          <button
            onClick={() => onViewModeChange('spread')}
            className={`flex items-center gap-1 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors ${
              viewMode === 'spread'
                ? 'text-[#111111] bg-[#111111]/5'
                : 'text-[#111111]/40 hover:text-[#111111]/60'
            }`}
          >
            <BookOpen className="h-3 w-3" />
            Spread
          </button>
        </div>
      )}

      {/* Main preview area */}
      <div className="relative flex-1">
        <div className="absolute inset-0 flex items-center justify-center px-4 pb-2 pt-4 sm:px-8">
          <div className="relative flex h-full w-full items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease }}
              className="relative h-full w-full"
            >
              {useSvg ? (
                /* ── SVG page renderer ── */
                <div className="relative h-full w-full">
                  <PageViewer
                    svgPages={svgPages}
                    viewMode={viewMode}
                  />
                  {/* Quality badge */}
                  {quality && <QualityBadge quality={quality} />}
                  {/* Quality warning banner */}
                  {quality?.typographyGrade && (quality.typographyGrade === 'C' || quality.typographyGrade === 'D') && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                      className={`absolute bottom-10 left-0 right-0 flex items-center gap-2 px-3 py-2 ${
                        quality.typographyGrade === 'D' ? 'bg-red-500/90' : 'bg-amber-500/90'
                      } ${isWatermarked ? 'bottom-[74px]' : ''}`}
                    >
                      <AlertTriangle className="h-3 w-3 shrink-0 text-white/80" />
                      <span className="font-mono text-[10px] font-medium text-white">
                        {quality.typographyGrade === 'D'
                          ? 'Low quality — adjust margins or template'
                          : 'Review typography before export'}
                      </span>
                    </motion.div>
                  )}
                  {isWatermarked && (
                    <div className="absolute bottom-10 left-0 right-0 flex items-center justify-between bg-amber-500/90 px-3 py-1.5">
                      <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-white">
                        Free preview — watermarked
                      </span>
                      <a href="/pricing" className="font-mono text-[10px] font-medium uppercase tracking-wider text-white underline decoration-white/50 hover:decoration-white">
                        Upgrade
                      </a>
                    </div>
                  )}
                </div>
              ) : pdfUrl ? (
                /* ── PDF iframe fallback ── */
                <div
                  className="relative h-full w-full max-h-[780px] max-w-[560px] mx-auto overflow-hidden bg-white transition-shadow duration-500"
                  style={{
                    boxShadow: status === 'success'
                      ? '0 2px 8px rgba(0,0,0,0.08), 0 12px 40px -8px rgba(0,0,0,0.12)'
                      : '0 1px 4px rgba(0,0,0,0.06), 0 8px 30px -6px rgba(0,0,0,0.10)',
                    border: '1px solid #e5e5e0',
                  }}
                >
                  <iframe
                    title="PDF preview"
                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                    className="h-full w-full"
                  />
                  {status === 'success' && quality && <QualityBadge quality={quality} />}
                  {status === 'success' && quality?.typographyGrade && (quality.typographyGrade === 'C' || quality.typographyGrade === 'D') && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                      className={`absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2 ${
                        quality.typographyGrade === 'D' ? 'bg-red-500/90' : 'bg-amber-500/90'
                      } ${isWatermarked ? 'bottom-[34px]' : ''}`}
                    >
                      <AlertTriangle className="h-3 w-3 shrink-0 text-white/80" />
                      <span className="font-mono text-[10px] font-medium text-white">
                        {quality.typographyGrade === 'D'
                          ? 'Low quality — adjust margins or template'
                          : 'Review typography before export'}
                      </span>
                    </motion.div>
                  )}
                  {isWatermarked && (
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-amber-500/90 px-3 py-1.5">
                      <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-white">
                        Free preview — watermarked
                      </span>
                      <a href="/pricing" className="font-mono text-[10px] font-medium uppercase tracking-wider text-white underline decoration-white/50 hover:decoration-white">
                        Upgrade
                      </a>
                    </div>
                  )}
                </div>
              ) : loading ? (
                <div className="h-full max-h-[780px] w-full max-w-[560px] mx-auto overflow-hidden bg-white" style={{ border: '1px solid #e5e5e0' }}>
                  <BookSkeleton />
                </div>
              ) : status === 'error' && errors.length > 0 ? (
                <div className="h-full max-h-[780px] w-full max-w-[560px] mx-auto overflow-hidden bg-white" style={{ border: '1px solid #e5e5e0' }}>
                  <ErrorPanel errors={errors} debug={debug} onRetry={onRetry} />
                </div>
              ) : (
                <div className="flex h-full max-h-[780px] w-full max-w-[560px] mx-auto items-center justify-center overflow-hidden bg-[#FDFCF8]" style={{ border: '1px solid #e5e5e0' }}>
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-16 w-12 items-center justify-center border border-[#e5e5e0]">
                      <FileText className="h-5 w-5 text-[#111111]/40" />
                    </div>
                    <p className="font-mono text-[11px] text-[#111111]/50">Preview appears here</p>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {(status === 'compiling' || status === 'queued') && pdfUrl && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 z-10 flex items-center justify-center bg-[#FDFCF8]/60 backdrop-blur-[2px]"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#FF3333] border-t-transparent" />
                      <span className="font-mono text-[11px] text-[#111111]/60">Typesetting...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
