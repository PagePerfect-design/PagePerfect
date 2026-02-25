'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, FileText, RotateCcw } from 'lucide-react'

import type { Status, CompileError, CompileQuality, CompileDebug } from './editor-types'
import { ease } from './editor-types'
import { translateError, suggestFix } from './editor-utils'

/* ═══════════════════════════════════════════════════════════════════
   SKELETON LOADER — SVG wireframe shown during typesetting
   ═══════════════════════════════════════════════════════════════════ */

function BookSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white">
      <div className="relative h-[520px] w-[380px]">
        <div className="absolute inset-0 rounded bg-[#111111]/[0.02] border border-[#111111]/[0.06]" />
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF3333]/40 to-transparent"
          initial={{ top: '10%' }}
          animate={{ top: '90%' }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
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
   QUALITY BADGE — Typography score shown after successful compile
   ═══════════════════════════════════════════════════════════════════ */

function QualityBadge({ quality }: { quality: CompileQuality }) {
  if (!quality || quality.typographyGrade === null) return null

  const gradeColor = {
    'A': 'text-emerald-600 border-emerald-500/20 bg-emerald-500/[0.06]',
    'B': 'text-blue-600 border-blue-500/20 bg-blue-500/[0.06]',
    'C': 'text-amber-600 border-amber-500/20 bg-amber-500/[0.06]',
    'D': 'text-red-600 border-red-500/20 bg-red-500/[0.06]',
  }[quality.typographyGrade] || 'text-[#111111]/40 border-[#111111]/10 bg-[#111111]/[0.03]'

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
        <div className="flex items-center gap-1 border border-amber-500/15 bg-amber-500/[0.04] px-2 py-1">
          <AlertTriangle className="h-2.5 w-2.5 text-amber-500/60" />
          <span className="font-mono text-[9px] text-amber-600/60">
            {quality.overfullBoxes > 0 && `${quality.overfullBoxes} overfull`}
            {quality.overfullBoxes > 0 && quality.underfullBoxes > 0 && ', '}
            {quality.underfullBoxes > 0 && `${quality.underfullBoxes} underfull`}
          </span>
        </div>
      )}
      {quality.buildId && (
        <div className="border border-[#111111]/[0.06] bg-[#111111]/[0.02] px-2 py-1" title={quality.buildId}>
          <span className="font-mono text-[8px] text-[#111111]/30">{quality.buildId.slice(0, 20)}</span>
        </div>
      )}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   ERROR PANEL — Differentiates expired previews from compile failures
   ═══════════════════════════════════════════════════════════════════ */

function ErrorPanel({ errors, debug, onRetry }: { errors: CompileError[]; debug?: CompileDebug; onRetry?: () => void }) {
  // Prefer structured isSoft flag; fall back to regex detection for backward compat
  const isExpired = errors.some(e => e.isSoft) || (
    !errors.some(e => e.isSoft === false) &&
    errors.some(e =>
      /expired|not found|recompile|try again/i.test(e.message) && !/failed|error|missing/i.test(e.message)
    )
  )

  // Find the first actionable fix — prefer structured fix from backend, fall back to suggestFix()
  const visibleErrors = errors.filter(e => !e.message.startsWith('__detail__'))
  const firstFix = (() => {
    // Check structured fix fields first
    const structured = visibleErrors.find(e => e.fix)
    if (structured?.fix) return structured.fix
    // Fall back to pattern-based suggestions
    const legacy = visibleErrors.find(e => suggestFix(e.message))
    return legacy ? suggestFix(legacy.message) : null
  })()

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#F8F7F3] p-4 sm:p-8">
      <div className="w-full max-w-[420px]">
        <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full border ${isExpired ? 'border-amber-500/20 bg-amber-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
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
          <div className="mt-3 flex items-start gap-2 border-l-2 border-blue-500/30 bg-blue-500/[0.04] px-3 py-2">
            <span className="font-mono text-[10px] leading-relaxed text-blue-700/70">
              Try: {firstFix}
            </span>
          </div>
        )}
        {errors.some(e => e.message.startsWith('__detail__')) && (
          <details className="mt-4">
            <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-wider text-[#111111]/30 transition-colors hover:text-[#111111]/60">
              Engine log
            </summary>
            <pre className="mt-2 max-h-[200px] overflow-auto whitespace-pre-wrap break-all border border-[#111111]/10 bg-[#111111]/[0.03] p-3 font-mono text-[9px] leading-relaxed text-[#111111]/40">
              {errors.filter(e => e.message.startsWith('__detail__')).map(e => e.message.replace('__detail__', '')).join('\n')}
            </pre>
          </details>
        )}
        {debug?.latexLog && (
          <details className="mt-2">
            <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-wider text-[#111111]/30 transition-colors hover:text-[#111111]/60">
              Full LaTeX log
            </summary>
            <pre className="mt-2 max-h-[300px] overflow-auto whitespace-pre-wrap break-all border border-[#111111]/10 bg-[#111111]/[0.03] p-3 font-mono text-[9px] leading-relaxed text-[#111111]/40">
              {debug.latexLog}
            </pre>
          </details>
        )}
        {debug?.texSource && (
          <details className="mt-2">
            <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-wider text-[#111111]/30 transition-colors hover:text-[#111111]/60">
              Generated LaTeX source
            </summary>
            <pre className="mt-2 max-h-[300px] overflow-auto whitespace-pre-wrap break-all border border-[#111111]/10 bg-[#111111]/[0.03] p-3 font-mono text-[9px] leading-relaxed text-[#111111]/40">
              {debug.texSource}
            </pre>
          </details>
        )}
        {debug?.headerTex && (
          <details className="mt-2">
            <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-wider text-[#111111]/30 transition-colors hover:text-[#111111]/60">
              Injected preamble (header.tex)
            </summary>
            <pre className="mt-2 max-h-[300px] overflow-auto whitespace-pre-wrap break-all border border-[#111111]/10 bg-[#111111]/[0.03] p-3 font-mono text-[9px] leading-relaxed text-[#111111]/40">
              {debug.headerTex}
            </pre>
          </details>
        )}
        {debug?.filesInDir && debug.filesInDir.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-wider text-[#111111]/30 transition-colors hover:text-[#111111]/60">
              Files in compile directory
            </summary>
            <pre className="mt-2 max-h-[150px] overflow-auto whitespace-pre-wrap break-all border border-[#111111]/10 bg-[#111111]/[0.03] p-3 font-mono text-[9px] leading-relaxed text-[#111111]/40">
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
   LEVITATING BOOK — The PDF preview sits center-screen
   ═══════════════════════════════════════════════════════════════════ */

export default function PreviewPane({
  pdfUrl,
  loading,
  status,
  errors,
  debug,
  isWatermarked,
  quality,
  onRetry,
  sideBySide = false,
}: {
  pdfUrl: string | null
  loading: boolean
  status: Status
  errors: CompileError[]
  debug?: CompileDebug
  isWatermarked: boolean
  quality?: CompileQuality
  onRetry?: () => void
  sideBySide?: boolean
}) {
  return (
    <div className={`absolute inset-0 flex items-center justify-center px-4 pb-24 pt-16 sm:px-0 ${sideBySide ? 'sm:left-1/2' : ''}`}>
      <div className="relative flex h-full max-h-[680px] w-full max-w-[calc(100vw-2rem)] items-center justify-center sm:max-w-[520px]">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease }}
          className="relative h-full w-full"
          style={{ perspective: '2000px' }}
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
              <>
                <iframe
                  title="PDF preview"
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                  className="h-full w-full"
                />
                {/* Quality badge — top right of preview */}
                {status === 'success' && quality && <QualityBadge quality={quality} />}
                {/* Quality warning banner — shown for C/D grades below the PDF */}
                {status === 'success' && quality?.typographyGrade && (quality.typographyGrade === 'C' || quality.typographyGrade === 'D') && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                    className={`absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2 ${
                      quality.typographyGrade === 'D'
                        ? 'bg-red-500/90'
                        : 'bg-amber-500/90'
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
              </>
            ) : loading ? (
              <BookSkeleton />
            ) : status === 'error' && errors.length > 0 ? (
              <ErrorPanel errors={errors} debug={debug} onRetry={onRetry} />
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
