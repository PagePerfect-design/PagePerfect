'use client'

import { Reveal } from '@/components/Reveal'
import { ChapterOpener } from './ChapterOpener'
import { Marginalia } from './Marginalia'
import { FigureCaption } from './FigureCaption'
import { FootnoteRef, FootnoteList } from './Footnote'

export function ChapterProblem() {
  return (
    <section id="ch-i" className="relative border-b border-[#111111] bg-[#FDFCF8] px-6 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-6xl">
        <ChapterOpener
          numeral="I"
          title="The Problem"
          kicker="01 · Why Word can't do this"
        >
          <p>
            You finish your manuscript at 11pm. You upload to Amazon KDP.
            You wake up to a rejection email
            <FootnoteRef chapter="i" n={1} />: <em>margins do not meet specifications</em>.
            You spent two months writing the book and forty hours formatting it,
            and Amazon&rsquo;s automated review killed it in three seconds.
          </p>
        </ChapterOpener>

        {/* Body + marginalia */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_14rem] md:gap-16">
          <div className="space-y-5 font-body text-[15px] leading-7 text-[#333333]">
            <p>
              Word can write a book. Word cannot
              <em> typeset </em>
              one. A typeset book follows hundreds of small rules — baseline
              grids, gutter widths, running heads, widow and orphan control,
              embedded fonts, PDF/X-1a output — that platforms enforce and Word
              does not produce.
            </p>
            <p>
              PagePerfect produces a print-compliant PDF on the first compile.
              No retries. No rejection emails<FootnoteRef chapter="i" n={2} />.
            </p>
          </div>

          <Marginalia side="right" label="Common rejections">
            <ul className="space-y-2">
              <li>· Margins under 0.375&rdquo; gutter</li>
              <li>· Spine width outside ±0.0625&rdquo;</li>
              <li>· Non-embedded fonts</li>
              <li>· RGB images in CMYK pipeline</li>
              <li>· Trim mark / bleed misalignment</li>
            </ul>
          </Marginalia>
        </div>

        {/* Figure — HTML mock of a KDP rejection panel */}
        <Reveal direction="up" delay={0.2}>
          <figure className="mt-16 border-2 border-[#111111] bg-[#ffffff]">
            <div className="flex items-center justify-between border-b border-[#111111]/15 bg-[#f5f5f0] px-4 py-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111]">
                Amazon KDP · Manuscript review
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#E52222]">
                Rejected
              </span>
            </div>
            <div className="px-6 py-6 md:px-10 md:py-8">
              <p className="font-mono text-[11px] leading-5 text-[#111111]">
                Your manuscript file does not meet our publishing requirements.
              </p>
              <ul className="mt-4 space-y-1.5 font-mono text-[11px] leading-5 text-[#555555]">
                <li>· Inner margin is less than the required minimum for your page count.</li>
                <li>· Embedded fonts are missing on pages 12, 47, 113.</li>
                <li>· Bleed not detected on full-bleed images.</li>
              </ul>
              <p className="mt-4 font-mono text-[11px] leading-5 text-[#555555]">
                Please revise and resubmit.
              </p>
            </div>
            <FigureCaption number="Fig. 1" className="px-6 pb-4 md:px-10">
              KDP automated review, typographic violations.
            </FigureCaption>
          </figure>
        </Reveal>

        <FootnoteList
          chapter="i"
          notes={[
            { n: 1, text: <span>Common KDP rejection language per the Amazon KDP help center, 2024.</span> },
            { n: 2, text: <span>Subject to platform changes by KDP / IngramSpark / Lulu — PagePerfect updates validation rules within seven days of any platform-spec revision.</span> },
          ]}
        />
      </div>
    </section>
  )
}
