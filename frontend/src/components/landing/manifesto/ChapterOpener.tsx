'use client'

import type { ReactNode } from 'react'
import { Reveal } from '@/components/Reveal'

type Numeral = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI'

interface ChapterOpenerProps {
  numeral: Numeral
  title: string
  kicker?: string
  /** First paragraph — will receive a CSS drop cap on its first letter. Pass a single <p> child. */
  children: ReactNode
  /** Tone — inverts text colour for the one ink-stock chapter. */
  tone?: 'cream' | 'ink'
  id?: string
}

export function ChapterOpener({
  numeral,
  title,
  kicker,
  children,
  tone = 'cream',
  id,
}: ChapterOpenerProps) {
  const isInk = tone === 'ink'
  const ink = isInk ? '#FDFCF8' : '#111111'
  const muted = isInk ? '#a8a8a0' : '#555555'
  const rule = isInk ? '#FDFCF8' : '#111111'
  const dropCapColor = isInk ? '#FF3333' : '#111111'

  return (
    <header id={id} className="mb-12 md:mb-20">
      <Reveal direction="up" blur={false}>
        <div
          className="h-px w-full"
          style={{ backgroundColor: rule, opacity: isInk ? 0.4 : 1 }}
        />

        <div className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-[6rem_1fr] md:gap-10 md:pt-10">
          {/* Roman numeral — display scale */}
          <span
            className="font-display font-extrabold leading-[0.85] tracking-tighter"
            style={{
              color: ink,
              fontSize: 'clamp(4rem, 12vw, 9rem)',
            }}
            aria-hidden="true"
          >
            {numeral}
          </span>

          {/* Title block */}
          <div>
            {kicker && (
              <p
                className="mb-4 font-mono text-[9px] uppercase tracking-[0.15em]"
                style={{ color: muted }}
              >
                {kicker}
              </p>
            )}
            <h2
              className="font-body italic leading-[1.05] tracking-tight"
              style={{
                color: ink,
                fontSize: 'clamp(2rem, 4.5vw, 4rem)',
              }}
            >
              <span className="sr-only">Chapter {numeral} — </span>
              {title}
            </h2>
          </div>
        </div>
      </Reveal>

      <Reveal direction="up" delay={0.1} blur={false}>
        <div
          className="manifesto-dropcap mt-10 max-w-[36rem] font-body leading-[1.7]"
          style={{
            color: ink,
            fontSize: '1.125rem',
            // CSS variables consumed by globals-docs.css / globals.css ::first-letter rule.
            ['--dropcap-color' as string]: dropCapColor,
          }}
        >
          {children}
        </div>
      </Reveal>
    </header>
  )
}
