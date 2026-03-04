'use client'

import Link from 'next/link'
import { Reveal } from '@/components/Reveal'

export function FinalCTA() {
  return (
    <section className="border-t-2 border-[#111111] bg-[#FDFCF8] py-28 md:py-40">
      <div className="mx-auto max-w-6xl px-6 md:px-8">

        {/* Decorative rule */}
        <Reveal direction="none">
          <div className="mb-16 h-[2px] w-16 bg-[#FF3333]" />
        </Reveal>

        <Reveal delay={0.08}>
          <p className="mb-5 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]">
            Zero rejections
          </p>

          <h2 className="max-w-2xl font-display text-[clamp(2rem,5vw,4.5rem)] font-extrabold leading-[0.88] tracking-tighter text-[#111111]">
            Upload to KDP tonight.
            <br />
            Pass review on the first try.
          </h2>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mt-6 max-w-md font-body text-sm leading-[1.7] text-[#111111]">
            Paste your manuscript. Pick your trim size. Preview for free, then
            export a print-compliant PDF from $19.99. No account, no install, no learning curve.
          </p>

          <div className="mt-12 flex flex-col items-start gap-5">
            <Link
              href="/app"
              className="inline-flex h-12 items-center bg-[#FF3333] px-12 font-mono text-[11px] uppercase tracking-[0.12em] text-white transition-all duration-200 ease-pp hover:bg-[#E52222]"
            >
              Start Formatting
            </Link>

            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#111111]">
              No account required &middot; Free to preview &middot; Works in any browser
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
