'use client'

import { Reveal } from '@/components/Reveal'

/**
 * Visual separator between landing page sections.
 * - `rule`: Swiss-style 2px horizontal rule that reveals on scroll
 * - `fade`: Gradient blend between dark ↔ light sections
 */
export function SectionTransition({ variant = 'rule' }: { variant?: 'rule' | 'fade' }) {
  if (variant === 'rule') {
    return (
      <Reveal direction="none">
        <div aria-hidden className="mx-auto my-16 h-[2px] w-full max-w-7xl bg-[#111111]" />
      </Reveal>
    )
  }

  return (
    <div
      aria-hidden
      className="h-24 bg-gradient-to-b from-[#050507] to-[#f7f6f3] md:h-30"
    />
  )
}
