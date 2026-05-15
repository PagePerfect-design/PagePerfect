'use client'

import { Reveal } from '@/components/Reveal'

const STATEMENTS = [
  {
    headline: 'Upload to KDP. Zero rejections.',
    body: 'Correct bleed, gutter, trim, and spine for every Amazon KDP and IngramSpark format. Your PDF passes automated review on the first upload \u2014 no rejection emails, no manual fixes, no re-uploading.',
  },
  {
    headline: 'Every page looks professionally typeset.',
    body: 'Our engine sees the whole page at once \u2014 eliminating widows, orphans, and bad breaks that Word misses. The same paragraph-level optimization used by Penguin, Oxford University Press, and academic publishers.',
  },
  {
    headline: 'Print-compliant from the first compile.',
    body: 'Embedded fonts, correct color profiles, PDF/X-1a output for offset printing, and platform-specific validation for KDP, IngramSpark, and Lulu. Your book meets spec before you download it.',
  },
]

export function WhyDifferent() {
  return (
    <section className="relative border-t-2 border-[#111111] bg-[#FDFCF8] py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6 md:px-8">

        {/* ── Heading ── */}
        <Reveal>
          <div className="mb-16 max-w-3xl md:mb-20">
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]">
              Guaranteed acceptance
            </p>
            <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] font-extrabold leading-[0.88] tracking-tighter text-[#111111]">
              Word can&apos;t do this.
              <br />
              We can.
            </h2>
          </div>
        </Reveal>

        {/* ── Statement rows ── */}
        <div>
          {STATEMENTS.map((s, i) => (
            <Reveal key={s.headline} delay={i * 0.08}>
              <div>
                <div className="h-px bg-[#111111]" />
                <div className="py-10 md:py-14">
                  <h3 className="font-display text-xl font-bold leading-[1.05] tracking-tight text-[#111111] md:text-2xl lg:text-[2rem]">
                    {s.headline}
                  </h3>
                  <p className="mt-3 max-w-xl font-body text-[14px] leading-[1.8] text-[#111111]">
                    {s.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
          <div className="h-px bg-[#111111]" />
        </div>
      </div>
    </section>
  )
}
