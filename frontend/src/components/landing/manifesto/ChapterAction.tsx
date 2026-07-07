'use client'

import Link from 'next/link'
import { Reveal } from '@/components/Reveal'
import { ChapterOpener } from './ChapterOpener'

export function ChapterAction() {
  return (
    <section id="ch-vi" className="relative bg-[#FDFCF8] px-6 py-32 md:px-8 md:py-48">
      <div className="mx-auto max-w-5xl">
        <ChapterOpener
          numeral="VI"
          title="The Action"
          kicker="06 · One step left"
        >
          <p>
            The engine is running. The templates are calibrated. The manuscript
            on your hard drive is one upload away from a print-compliant PDF.
            Open the editor and start.
          </p>
        </ChapterOpener>

        <Reveal direction="up" delay={0.1}>
          <div className="mt-16 max-w-3xl">
            <h3
              className="font-display font-extrabold leading-[0.88] tracking-tighter text-[#111111]"
              style={{ fontSize: 'clamp(2.25rem, 6vw, 5rem)' }}
            >
              Upload to KDP tonight.
              <br />
              Pass review on the first try.
            </h3>
          </div>
        </Reveal>

        <Reveal direction="up" delay={0.2} blur={false}>
          <div className="mt-12 flex flex-col items-start gap-6">
            <Link
              href="/app"
              className="inline-flex h-14 items-center bg-[#FF3333] px-12 font-mono text-[12px] uppercase tracking-[0.15em] text-white transition-[background-color,transform] duration-200 ease-pp hover:bg-[#E52222] active:scale-[0.97]"
            >
              Start formatting →
            </Link>
            <p className="font-body italic text-[12px] text-[#555555]">
              No account. No install. No learning curve.
            </p>
          </div>
        </Reveal>

        {/* Inline colophon — replaces standalone Colophon chapter; footer carries the legal colophon */}
        <Reveal direction="up" delay={0.3} blur={false}>
          <div className="mt-32 border-t border-[#111111]/15 pt-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#555555]">
              Composed in Inter Tight, Source Serif 4, and IBM Plex Mono.
              Set against the PagePerfect specimen system. Engine: Typst.
              Converter: Pandoc 3.x.  · MMXXVI
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
