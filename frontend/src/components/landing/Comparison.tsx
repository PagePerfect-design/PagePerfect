'use client'

import { Reveal } from '@/components/Reveal'

export function Comparison() {
  return (
    <section className="relative bg-[#FDFCF8] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-8">

        {/* ── Header ── */}
        <Reveal>
          <div className="mb-12 max-w-2xl md:mb-16">
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]">
              Fig. 1 &mdash; Before &amp; After
            </p>
            <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] font-extrabold leading-[0.88] tracking-tighter text-[#111111]">
              Same words.
              <br />
              Different book.
            </h2>
            <p className="mt-5 max-w-lg font-body text-sm leading-[1.7] text-[#333333]">
              On the left, a manuscript pasted from Word. On the right,
              the same text &mdash; KDP-ready, print-compliant, uploaded tonight.
            </p>
          </div>
        </Reveal>

        {/* ── Comparison Frame — 2px ruled border, side by side ── */}
        <Reveal delay={0.15}>
          <div className="border-2 border-[#111111]">
            <div className="grid grid-cols-1 md:grid-cols-2">

              {/* LEFT: Word doc */}
              <div className="border-b-2 border-[#111111] md:border-b-0 md:border-r-2">
                <div className="border-b border-[#111111]/10 px-4 py-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#111111]">
                    .docx &mdash; Microsoft Word
                  </span>
                </div>
                <div className="bg-white p-6 md:p-8 lg:p-10">
                  <div className="max-w-md">
                    <div className="mb-4 text-[18px] font-bold uppercase text-black/60" style={{ fontFamily: 'Times New Roman, serif' }}>
                      CHAPTER ONE
                    </div>
                    <div className="space-y-3 text-[13px] leading-[1.6] text-black/50" style={{ fontFamily: 'Times New Roman, serif' }}>
                      <p>
                        <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>The morning light filtered through the old windows of the library, casting long shadows across the worn wooden desk where she&apos;d spent every morning for the past three years.&nbsp;&nbsp;The coffee had gone cold again.
                      </p>
                      <p>
                        <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>She picked up the manuscript — three hundred pages of her life&apos;s work, still{' '}
                        <span className="underline decoration-wavy decoration-red-400 decoration-[0.5px] underline-offset-2">
                          unfinished
                        </span>
                        ,&nbsp;still demanding&nbsp;more. The margins were wrong.&nbsp;&nbsp;The font was wrong.
                      </p>
                    </div>
                    {/* Simulated bad formatting */}
                    <div className="mt-4 space-y-2">
                      <div className="h-[2px] w-[75%] bg-black/4" />
                      <div className="h-[2px] w-[90%] bg-black/4" />
                      <div className="h-[2px] w-[60%] bg-black/4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Typeset PDF */}
              <div>
                <div className="border-b border-[#111111]/10 px-4 py-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#111111]">
                    .pdf &mdash; PagePerfect
                  </span>
                </div>
                <div className="bg-[#fafaf5] p-6 md:p-8 lg:p-10">
                  <div className="max-w-md">
                    <p className="mb-6 text-center font-mono text-[7px] uppercase tracking-[0.35em] text-black/15">
                      Chapter One
                    </p>
                    <h3 className="mb-1 text-center text-[20px] font-normal tracking-wide text-black/65" style={{ fontFamily: 'Georgia, serif' }}>
                      The Beginning
                    </h3>
                    <div className="mx-auto mb-5 h-px w-10 bg-black/10" />

                    <div className="text-[12px] leading-[1.9] text-black/45" style={{ fontFamily: 'Georgia, serif' }}>
                      <span className="float-left mr-1.5 mt-[1px] text-[36px] leading-[0.8] text-black/55" style={{ fontFamily: 'Georgia, serif' }}>
                        T
                      </span>
                      he morning light filtered through the old windows of the library, casting long shadows across the worn wooden desk where she had spent every morning for the past three years. The coffee had gone cold again.
                      <p className="mt-2.5">
                        She picked up the manuscript&thinsp;&mdash;&thinsp;three hundred pages of her life&rsquo;s work, still unfinished, still demanding more. The margins were wrong. The font was wrong.
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-center gap-2">
                      <div className="h-px w-6 bg-black/6" />
                      <span className="font-mono text-[8px] tracking-[0.2em] text-black/15">7</span>
                      <div className="h-px w-6 bg-black/6" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── Annotations ── */}
        <Reveal delay={0.25}>
          <div className="mt-8 grid grid-cols-1 gap-6 border-t border-[#111111]/20 pt-6 sm:grid-cols-3">
            {[
              { label: 'Margins', desc: 'Correct bleed, gutter, and trim \u2014 no KDP rejection for margin errors' },
              { label: 'Typography', desc: 'Professional line spacing and page breaks \u2014 no more orphaned lines' },
              { label: 'Structure', desc: 'Chapter openings, running heads, and page numbers \u2014 ready to upload' },
            ].map((item) => (
              <div key={item.label}>
                <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]">
                  {item.label}
                </p>
                <p className="font-body text-[13px] leading-relaxed text-[#333333]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
