import type { ReactNode } from 'react'

interface FigureCaptionProps {
  /** Roman or arabic figure number, e.g. "Fig. 1" or "Pl. 03". */
  number: string
  /** Caption body. */
  children: ReactNode
  className?: string
}

export function FigureCaption({ number, children, className = '' }: FigureCaptionProps) {
  return (
    <figcaption
      className={`mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#555555] ${className}`}
    >
      <span className="text-[#111111]">{number}</span>
      <span aria-hidden="true"> — </span>
      <span className="normal-case tracking-normal">{children}</span>
    </figcaption>
  )
}
