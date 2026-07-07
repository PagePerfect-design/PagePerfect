'use client'

import Link from 'next/link'
import { RevealGroup } from '@/components/Reveal'
import { ChapterOpener } from './ChapterOpener'
import { RequestFormatCard } from '../RequestFormatCard'
import { TEMPLATES, SPECIMENS } from './template-specimens'

export function ChapterTemplates() {
  return (
    <section
      id="ch-iii"
      className="relative border-b border-[#FDFCF8]/20 bg-[#111111] px-6 py-24 md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <ChapterOpener
          numeral="III"
          title="The Templates"
          kicker="03 · Fifteen production-ready designs"
          tone="ink"
        >
          <p>
            Each template is a complete, print-validated layout system — a
            named typeface, a baseline grid, a margin discipline. Every design
            passes Amazon KDP and IngramSpark review out of the box. Pick the
            genre; the rest is calibrated.
          </p>
        </ChapterOpener>

        {/* Ruled gallery — gap trick uses cream border to show through 2px gaps */}
        <div className="border-2 border-[#FDFCF8] bg-[#FDFCF8]">
          <RevealGroup
            staggerDelay={0.05}
            className="grid grid-cols-1 gap-[2px] sm:grid-cols-2 lg:grid-cols-3"
          >
            {TEMPLATES.map((t, i) => {
              const Specimen = SPECIMENS[t.key]
              return (
                <Link
                  key={t.key}
                  href={`/app?template=${t.key}`}
                  className="group block bg-[#FDFCF8] transition-colors duration-200 ease-pp hover:bg-[#f5f5f0]"
                >
                  {/* Plate number + category */}
                  <div className="flex items-baseline justify-between px-6 pt-6">
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#111111]/50">
                      Pl. {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#111111]/50">
                      {t.category}
                    </span>
                  </div>

                  <h3 className="px-6 pt-2 font-display text-2xl font-bold tracking-tight text-[#111111] md:text-[1.625rem]">
                    {t.name}
                  </h3>

                  {/* Enlarged specimen — 240px target via aspect-ratio + overflow */}
                  <div
                    className="mx-4 mt-4 border border-[#111111]/10"
                    style={{ aspectRatio: '5 / 8', minHeight: '240px', overflow: 'hidden' }}
                  >
                    {Specimen && (
                      <div className="h-full w-full" style={{ transform: 'scale(1.85)', transformOrigin: 'top left' }}>
                        <Specimen />
                      </div>
                    )}
                  </div>

                  {/* Font + grid math */}
                  <div className="space-y-1 px-6 pb-6 pt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[10px] text-[#111111]/50">Font</span>
                      <span className="font-mono text-[10px] text-[#111111]/55">{t.font}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[10px] text-[#111111]/50">Base</span>
                      <span className="font-mono text-[10px] text-[#111111]/55">{t.baseline} / {t.leading}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[10px] text-[#111111]/50">Scale</span>
                      <span className="font-mono text-[10px] text-[#111111]/55">{t.scale}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
            {/* 16th slot */}
            <div className="bg-[#FDFCF8]">
              <RequestFormatCard />
            </div>
          </RevealGroup>
        </div>
      </div>
    </section>
  )
}
