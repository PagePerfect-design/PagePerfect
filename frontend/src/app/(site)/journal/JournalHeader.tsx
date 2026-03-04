'use client'

import { Reveal } from '@/components/Reveal'

export default function JournalHeader() {
  return (
    <section className="border-b-2 border-[#111111] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <Reveal>
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50 mb-3">
            Vol. I — Essays on Design &amp; Persuasion
          </p>
          <h1 className="font-display text-h1 font-extrabold tracking-tighter text-[#111111]" style={{ lineHeight: 0.95 }}>
            Typography &amp; Conversion
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-2xl font-body text-lg leading-relaxed text-[#333333]">
            Where Swiss precision meets Madison Avenue pragmatism. Essays on typography,
            layout, and visual communication — grounded in empirical research, not aesthetic opinion.
          </p>
          <p className="mt-3 font-body text-base leading-relaxed text-[#4a4a4a]">
            Every design choice must be justified by data, reader psychology, or conversion metrics.
            We do not design to win awards. We design to communicate.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
