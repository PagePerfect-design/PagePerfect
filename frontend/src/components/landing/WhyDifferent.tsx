'use client'

import Image from 'next/image'
import { Reveal } from './Reveal'

const STATEMENTS = [
  {
    num: '01',
    headline: 'Your pages have rhythm.',
    body: 'Every line sits on a mathematical baseline grid \u2014 the same technique used by Penguin, Oxford University Press, and every book you\u2019ve admired on a shelf.',
    visual: (
      <div className="flex gap-[3px]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex-1">
            <div className="h-px bg-accent/20" />
            <div className="h-4" />
            <div className="h-px bg-accent/10" />
            <div className="h-4" />
            <div className="h-px bg-accent/20" />
            <div className="h-4" />
            <div className="h-px bg-accent/10" />
          </div>
        ))}
      </div>
    ),
  },
  {
    num: '02',
    headline: 'Your paragraphs breathe.',
    body: 'Our engine analyzes entire paragraphs to find optimal line breaks. Word goes line by line. We see the whole picture.',
    visual: (
      <div className="space-y-[6px]">
        {[85, 92, 78, 95, 88, 72, 90, 82].map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-[2px] rounded-full bg-gradient-to-r from-accent/30 to-accent/5" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    ),
  },
  {
    num: '03',
    headline: 'Your book is print-ready.',
    body: 'PDFs that pass KDP\u2019s automated review on the first try. Correct bleed, margins, and trim for 11 standard book sizes.',
    visual: (
      <div className="flex items-center justify-center gap-3">
        {['5\u00d78', '6\u00d79', 'A5', 'Letter'].map((size) => (
          <div key={size} className="rounded-lg border border-accent/10 bg-accent/[0.03] px-3 py-1.5">
            <span className="font-mono text-[10px] text-accent/50">{size}</span>
          </div>
        ))}
      </div>
    ),
  },
]

export function WhyDifferent() {
  return (
    <section className="section-separator relative py-32 md:py-44">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[20%] top-1/3 h-[400px] w-[400px] rounded-full bg-[radial-gradient(ellipse,rgba(59,130,246,0.05)_0%,transparent_70%)]" />
        <div className="absolute right-[15%] bottom-1/4 h-[300px] w-[300px] rounded-full bg-[radial-gradient(ellipse,rgba(168,85,247,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 md:px-8">
        <Reveal>
          <div className="mb-20 text-center md:mb-28">
            <h2 className="font-display text-display-lg font-bold tracking-tighter text-white">
              Not just formatted.{' '}
              <span className="gradient-hero-text">
                Typeset.
              </span>
            </h2>
          </div>
        </Reveal>

        {/* Cinematic image break — floating letters from open book */}
        <Reveal delay={0.1}>
          <div className="relative mx-auto mb-20 overflow-hidden rounded-2xl md:mb-28">
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-surface via-surface/40 to-surface/60" />
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-surface/50 via-transparent to-surface/50" />
            <Image
              src="/images/book-magic-letters.webp"
              alt="Letters floating from an open book — the magic of typesetting"
              width={1400}
              height={539}
              className="w-full object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
            />
          </div>
        </Reveal>

        <div className="space-y-0">
          {STATEMENTS.map((s, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="group grid grid-cols-1 gap-8 border-t border-white/[0.06] py-16 md:grid-cols-[1fr_280px] md:gap-16 md:py-24">
                <div>
                  <span className="mb-4 inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-accent/30">
                    {s.num}
                  </span>
                  <h3 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl lg:leading-[1.1]">
                    {s.headline}
                  </h3>
                  <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/35 md:text-xl">
                    {s.body}
                  </p>
                </div>
                <div className="hidden items-center justify-center rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 transition-all duration-500 group-hover:border-accent/10 group-hover:bg-accent/[0.02] md:flex">
                  {s.visual}
                </div>
              </div>
            </Reveal>
          ))}
          <div className="h-px bg-white/[0.06]" />
        </div>
      </div>
    </section>
  )
}
