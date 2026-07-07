'use client'

/* ═══════════════════════════════════════════════════════════════════
   STATUS BAR — Bottom strip: engine · grade · build-id · status
   Swiss precision instrument readout
   ═══════════════════════════════════════════════════════════════════ */

import type { Status, CompileQuality } from './editor-types'
import Tooltip from './Tooltip'

export default function StatusBar({
  status,
  quality,
}: {
  status: Status
  quality: CompileQuality
}) {
  const gradeColor = quality?.typographyGrade
    ? {
        A: 'text-emerald-700',
        B: 'text-blue-600',
        C: 'text-amber-700',
        D: 'text-[#E52222]',
      }[quality.typographyGrade] || 'text-[#555555]'
    : 'text-[#555555]'

  const statusLabel =
    status === 'queued' ? 'QUEUED' :
    status === 'compiling' ? 'TYPESETTING' :
    status === 'success' ? 'READY' :
    status === 'error' ? 'ERROR' :
    'IDLE'

  const statusColor =
    status === 'compiling' || status === 'queued' ? 'text-[#E52222]' :
    status === 'success' ? 'text-emerald-700' :
    status === 'error' ? 'text-[#E52222]' :
    'text-[#555555]'

  return (
    <div className="flex h-8 shrink-0 items-center justify-between border-t border-[#111111]/10 bg-[#FDFCF8] px-4">
      <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.12em]">
        {/* Engine */}
        {quality?.engine && (
          <>
            <Tooltip content="Typesetting engine" detail="Typst processes your manuscript into a typeset PDF" placement="top">
              <span className="text-[#555555] cursor-default">{quality.engine}</span>
            </Tooltip>
            <span className="text-[#111111]/20">·</span>
          </>
        )}

        {/* Grade */}
        {quality?.typographyGrade && (
          <>
            <Tooltip
              content={`Typography Grade ${quality.typographyGrade}`}
              detail={
                quality.typographyGrade === 'A' ? 'Excellent — no typographic issues' :
                quality.typographyGrade === 'B' ? 'Good — minor issues detected' :
                quality.typographyGrade === 'C' ? 'Fair — consider adjusting margins or template' :
                'Poor — adjust margins, page size, or template for better results'
              }
              placement="top"
            >
              <span className="text-[#555555] cursor-default">
                GRADE <span className={`font-bold ${gradeColor}`}>{quality.typographyGrade}</span>
              </span>
            </Tooltip>
            <span className="text-[#111111]/20">·</span>
          </>
        )}

        {/* Build ID */}
        {quality?.buildId && (
          <>
            <Tooltip content="Build identifier" detail={quality.buildId} placement="top">
              <span className="text-[#555555] cursor-default">
                {quality.buildId.slice(0, 12)}
              </span>
            </Tooltip>
            <span className="text-[#111111]/20">·</span>
          </>
        )}

        {/* Status */}
        <Tooltip
          content={statusLabel}
          detail={
            status === 'compiling' ? 'Typst is processing your manuscript' :
            status === 'queued' ? 'Waiting for an available compile slot' :
            status === 'success' ? 'PDF ready — preview and download available' :
            status === 'error' ? 'Compilation failed — check the preview for details' :
            'Waiting for changes to trigger a compile'
          }
          placement="top"
        >
          <span role="status" aria-live="polite" className={`cursor-default ${statusColor}`}>
            {(status === 'compiling' || status === 'queued') && (
              <span className="mr-1 inline-block h-1 w-1 animate-pulse rounded-full bg-current" />
            )}
            {statusLabel}
          </span>
        </Tooltip>
      </div>

      {/* Overfull warnings */}
      {quality && (quality.overfullBoxes > 0 || quality.underfullBoxes > 0) && (
        <Tooltip
          content="Layout warnings"
          detail="Overfull: text extends past margins. Underfull: gaps in text. Try wider margins or a different template."
          placement="top"
        >
          <span className="font-mono text-[10px] text-amber-700 cursor-default">
            {quality.overfullBoxes > 0 && `${quality.overfullBoxes} overfull`}
            {quality.overfullBoxes > 0 && quality.underfullBoxes > 0 && ' · '}
            {quality.underfullBoxes > 0 && `${quality.underfullBoxes} underfull`}
          </span>
        </Tooltip>
      )}
    </div>
  )
}
