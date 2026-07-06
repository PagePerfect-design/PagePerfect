'use client'

import { Reveal } from '@/components/Reveal'
import { ChapterOpener } from './ChapterOpener'
import { FigureCaption } from './FigureCaption'
import { FootnoteRef, FootnoteList } from './Footnote'

const mockupStyles = {
  times: { fontFamily: 'Times New Roman, serif' },
  georgia: { fontFamily: 'var(--font-body), serif' },
} as const

export function ChapterComparison() {
  return (
    <section id="ch-ii" className="relative border-b border-[#111111] bg-[#f5f5f0] px-6 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-6xl">
        <ChapterOpener
          numeral="II"
          title="The Comparison"
          kicker="02 · Same words, different book"
        >
          <p>
            Two files contain the identical sentence. One is a Word document.
            The other is a print-ready interior compiled by PagePerfect. The
            same author wrote both. The reader will not experience the
            same book<FootnoteRef chapter="ii" n={1} />.
          </p>
        </ChapterOpener>

        {/* The artifact — reused from _archive/Comparison.tsx, framed as Fig. 2 */}
        <Reveal direction="up" delay={0.1}>
          <figure>
            <div className="border-2 border-[#111111] bg-[#FDFCF8]">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* LEFT — Word doc */}
                <div aria-hidden="true" className="border-b-2 border-[#111111] md:border-b-0 md:border-r-2">
                  <div className="border-b border-[#111111]/10 px-4 py-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111]">
                      .docx — Microsoft Word
                    </span>
                  </div>
                  <div className="bg-white p-6 md:p-10 lg:p-14">
                    <div className="max-w-md">
                      <div
                        className="mb-4 text-[18px] font-bold uppercase text-[#111111]/60"
                        style={mockupStyles.times}
                      >
                        CHAPTER ONE
                      </div>
                      <div
                        className="space-y-4 text-[13px] leading-6 text-[#111111]/50"
                        style={mockupStyles.times}
                      >
                        <p>
                          <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>The morning light filtered through the old windows of the library, casting long shadows across the worn wooden desk where she&apos;d spent every morning for the past three years.&nbsp;&nbsp;The coffee had gone cold again.
                        </p>
                        <p>
                          <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>She picked up the manuscript — three hundred pages of her life&apos;s work, still{' '}
                          <span className="underline decoration-wavy decoration-[#FF3333] decoration-[0.5px] underline-offset-2">unfinished</span>
                          ,&nbsp;still demanding&nbsp;more. The margins were wrong.&nbsp;&nbsp;The font was wrong.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT — Typeset */}
                <div aria-hidden="true">
                  <div className="border-b border-[#111111]/10 px-4 py-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111]">
                      .pdf — PagePerfect
                    </span>
                  </div>
                  <div className="bg-[#f5f5f0] p-6 md:p-10 lg:p-14">
                    <div className="max-w-md">
                      <p className="mb-6 text-center font-mono text-[7px] uppercase tracking-[0.35em] text-[#111111]/15">
                        Chapter One
                      </p>
                      <h3
                        className="mb-2 text-center text-[20px] font-normal tracking-wide text-[#111111]"
                        style={mockupStyles.georgia}
                      >
                        The Beginning
                      </h3>
                      <div className="mx-auto mb-6 h-px w-10 bg-[#111111]/10" />
                      <div
                        className="text-[12px] leading-6 text-[#111111]/85"
                        style={mockupStyles.georgia}
                      >
                        <span
                          className="float-left mr-2 mt-[1px] text-[36px] leading-[0.8] text-[#111111]/55"
                          style={mockupStyles.georgia}
                        >
                          T
                        </span>
                        he morning light filtered through the old windows of the library, casting long shadows across the worn wooden desk where she had spent every morning for the past three years. The coffee had gone cold again.
                        <p className="mt-2">
                          She picked up the manuscript&thinsp;—&thinsp;three hundred pages of her life&rsquo;s work, still unfinished, still demanding more. The margins were wrong. The font was wrong.
                        </p>
                      </div>
                      <div className="mt-6 flex items-center justify-center gap-2">
                        <div className="h-px w-6 bg-[#111111]/10" />
                        <span className="font-mono text-[8px] tracking-[0.2em] text-[#111111]/15">7</span>
                        <div className="h-px w-6 bg-[#111111]/10" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <FigureCaption number="Fig. 2" className="mt-4">
              Same words, different book. Left: Word default output. Right: PagePerfect compiled interior.
            </FigureCaption>
          </figure>
        </Reveal>

        {/* Pull-quote */}
        <Reveal direction="up" delay={0.2} blur={false}>
          <blockquote
            className="mx-auto mt-16 max-w-2xl border-l-2 border-[#FF3333] pl-6 font-body italic leading-9 text-[#111111]"
            style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)' }}
          >
            &ldquo;The same words. A different book.&rdquo;
          </blockquote>
        </Reveal>

        <FootnoteList
          chapter="ii"
          notes={[
            { n: 1, text: <span>The typographic gap between word-processor output and typeset interior is documented in Bringhurst, R. (2012). <em>The Elements of Typographic Style</em>, 4th ed., pp. 19–28.</span> },
          ]}
        />
      </div>
    </section>
  )
}
