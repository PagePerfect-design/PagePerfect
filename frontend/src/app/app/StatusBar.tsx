'use client'

/* ═══════════════════════════════════════════════════════════════════
   STATUS BAR — Bottom strip: engine · grade · build-id · status
   Swiss precision instrument readout
   ═══════════════════════════════════════════════════════════════════ */

import type { Status, CompileQuality } from './editor-types'

export default function StatusBar({
  status,
  quality,
}: {
  status: Status
  quality: CompileQuality
}) {
  const gradeColor = quality?.typographyGrade
    ? {
        A: 'text-emerald-600',
        B: 'text-blue-600',
        C: 'text-amber-600',
        D: 'text-red-600',
      }[quality.typographyGrade] || 'text-[#111111]/40'
    : 'text-[#111111]/40'

  const statusLabel =
    status === 'queued' ? 'QUEUED' :
    status === 'compiling' ? 'TYPESETTING' :
    status === 'success' ? 'READY' :
    status === 'error' ? 'ERROR' :
    'IDLE'

  const statusColor =
    status === 'compiling' || status === 'queued' ? 'text-[#FF3333]' :
    status === 'success' ? 'text-emerald-600' :
    status === 'error' ? 'text-red-500' :
    'text-[#111111]/50'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex h-7 items-center justify-between border-t border-[#e5e5e0] bg-[#FDFCF8] px-4">
      <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.12em]">
        {/* Engine */}
        {quality?.engine && (
          <>
            <span className="text-[#111111]/50">{quality.engine}</span>
            <span className="text-[#111111]/30">·</span>
          </>
        )}

        {/* Grade */}
        {quality?.typographyGrade && (
          <>
            <span className="text-[#111111]/50">
              GRADE <span className={`font-bold ${gradeColor}`}>{quality.typographyGrade}</span>
            </span>
            <span className="text-[#111111]/30">·</span>
          </>
        )}

        {/* Build ID */}
        {quality?.buildId && (
          <>
            <span className="text-[#111111]/40" title={quality.buildId}>
              {quality.buildId.slice(0, 12)}
            </span>
            <span className="text-[#111111]/30">·</span>
          </>
        )}

        {/* Status */}
        <span className={statusColor}>
          {(status === 'compiling' || status === 'queued') && (
            <span className="mr-1 inline-block h-1 w-1 animate-pulse rounded-full bg-current" />
          )}
          {statusLabel}
        </span>
      </div>

      {/* Overfull warnings */}
      {quality && (quality.overfullBoxes > 0 || quality.underfullBoxes > 0) && (
        <span className="font-mono text-[9px] text-amber-600/80">
          {quality.overfullBoxes > 0 && `${quality.overfullBoxes} overfull`}
          {quality.overfullBoxes > 0 && quality.underfullBoxes > 0 && ' · '}
          {quality.underfullBoxes > 0 && `${quality.underfullBoxes} underfull`}
        </span>
      )}
    </div>
  )
}
