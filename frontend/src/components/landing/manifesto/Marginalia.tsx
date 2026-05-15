import type { ReactNode } from 'react'

interface MarginaliaProps {
  side?: 'left' | 'right'
  label?: string
  children: ReactNode
  className?: string
}

/**
 * A printed-page marginal note. Editorial designers use these to surface
 * a stat, citation, or aside without breaking the body's reading flow.
 * Default side is right. Renders in IBM Plex Mono at 11px.
 */
export function Marginalia({
  side = 'right',
  label,
  children,
  className = '',
}: MarginaliaProps) {
  return (
    <aside
      className={`max-w-[14rem] ${side === 'left' ? 'text-right' : 'text-left'} ${className}`}
    >
      {label && (
        <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#555555]">
          {label}
        </p>
      )}
      <div className="font-mono text-[11px] leading-[1.55] tracking-[0.01em] text-[#555555]">
        {children}
      </div>
    </aside>
  )
}
