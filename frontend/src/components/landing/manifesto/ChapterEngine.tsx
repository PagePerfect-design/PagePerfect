'use client'

import Image from 'next/image'
import { Reveal } from '@/components/Reveal'
import { ChapterOpener } from './ChapterOpener'
import { Marginalia } from './Marginalia'
import { FigureCaption } from './FigureCaption'

const CAPABILITIES = {
  Compliance: [
    'Amazon KDP — spine, gutter, trim validation',
    'IngramSpark — PDF/X-1a, ICC profile, CMYK',
    'Lulu xPress — API, cost estimation',
    '19 page sizes per platform',
  ],
  Quality: [
    'Paragraph-level line-break optimisation',
    'Widow / orphan control + hyphenation',
    'Pre-flight blocks non-compliant exports',
    'Embedded fonts, no substitution',
  ],
  Output: [
    'PDF/X-1a output for offset printing',
    'Correct bleed, trim marks, safe zones',
    'Ghostscript post-processing',
    'Per-distributor export pipelines',
  ],
}

const COLOPHON_ROWS = [
  ['Engine', 'Typst'],
  ['Converter', 'Pandoc 3.x'],
  ['Post-proc', 'Ghostscript 10.x'],
  ['Platforms', 'KDP · IngramSpark · Lulu · Offset'],
  ['Output', 'PDF · PDF/X-1a · EPUB 3'],
  ['Validation', 'Bleed · Gutter · Trim · Spine · Margins'],
  ['Input', '2 MB Markdown · 10 MB DOCX'],
  ['Timeout', '45,000 ms'],
] as const

export function ChapterEngine() {
  return (
    <section id="ch-iv" className="relative border-b border-[#111111] bg-[#FDFCF8] px-6 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Optional masthead photograph slot — landscape, no overlaid text yet */}
        <Reveal direction="up" blur={false}>
          <figure className="mb-16 border border-[#111111]/15">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#f5f5f0]">
              <Image
                src="/landing/landing-engine-masthead.webp"
                alt="A typographic specimen sheet showing numeric scales and baseline rules under raking light."
                width={1408}
                height={768}
                className="h-full w-full object-cover"
              />
            </div>
          </figure>
        </Reveal>

        <ChapterOpener
          numeral="IV"
          title="The Engine"
          kicker="04 · Compliance infrastructure"
        >
          <p>
            PagePerfect is not a wrapper around a PDF library. It is the
            same typesetting engine used by academic publishers — Typst — with
            platform-specific validation built into every export. Bleed,
            gutter, trim, baseline grid: every page leaves the engine
            already correct.
          </p>
        </ChapterOpener>

        {/* The artifact — page anatomy diagram (SVG placeholder for real Typst export) */}
        <Reveal direction="up" delay={0.1}>
          <figure className="mt-12">
            <div className="border-2 border-[#111111] bg-[#ffffff] p-6 md:p-10">
              <PageAnatomyDiagram />
            </div>
            <FigureCaption number="Fig. 3" className="mt-3">
              Print interior page anatomy. Trim 5 × 8 in. Bleed 0.125 in. Inner margin 0.875 in.
            </FigureCaption>
          </figure>
        </Reveal>

        {/* Capabilities — three marginalia clusters */}
        <div className="mt-20 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
          {(Object.entries(CAPABILITIES) as [string, string[]][]).map(([cat, items]) => (
            <Marginalia key={cat} side="left" label={cat}>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-px text-[#111111]/25">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Marginalia>
          ))}
        </div>

        {/* Colophon-style spec table */}
        <Reveal direction="up" delay={0.15} blur={false}>
          <div className="mt-20">
            <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.15em] text-[#555555]">
              Colophon
            </p>
            <div className="border-t-2 border-b-2 border-[#111111]">
              {COLOPHON_ROWS.map(([label, value], i) => (
                <div
                  key={label}
                  className={`grid grid-cols-[8rem_1fr] py-2.5 md:grid-cols-[10rem_1fr] ${
                    i < COLOPHON_ROWS.length - 1 ? 'border-b border-[#111111]/10' : ''
                  }`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#555555]">
                    {label}
                  </span>
                  <span className="font-mono text-[10px] text-[#333333]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/**
 * Page anatomy SVG — print interior with labelled callouts.
 * Replace with a real Typst PDF screenshot when one is provided by the operator.
 */
function PageAnatomyDiagram() {
  return (
    <svg
      viewBox="-180 -50 970 870"
      className="h-auto w-full"
      role="img"
      aria-label="Annotated page anatomy diagram showing bleed, trim, gutter, baseline, running head, and folio."
    >
      {/* Bleed (outer) */}
      <rect x="20" y="20" width="560" height="760" fill="#fafaf5" stroke="#FF3333" strokeDasharray="4 4" strokeWidth="1" />
      {/* Trim */}
      <rect x="60" y="60" width="480" height="680" fill="#ffffff" stroke="#111111" strokeWidth="1.5" />
      {/* Live area */}
      <rect x="120" y="120" width="360" height="560" fill="none" stroke="#111111" strokeDasharray="2 3" strokeWidth="0.75" opacity="0.4" />

      {/* Running head */}
      <text x="300" y="100" textAnchor="middle" fontFamily="serif" fontStyle="italic" fontSize="11" fill="#111111" opacity="0.5">
        Running head — chapter title
      </text>

      {/* Body lines (baseline grid sample) */}
      {Array.from({ length: 24 }).map((_, i) => (
        <line
          key={i}
          x1="120"
          y1={150 + i * 22}
          x2="480"
          y2={150 + i * 22}
          stroke="#111111"
          strokeWidth="0.5"
          opacity="0.18"
        />
      ))}

      {/* Folio */}
      <text x="300" y="720" textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#111111" opacity="0.45">
        7
      </text>

      {/* Callouts */}
      {/* Bleed callout */}
      <line x1="20" y1="20" x2="-30" y2="-20" stroke="#FF3333" strokeWidth="1" />
      <text x="-130" y="-25" fontFamily="monospace" fontSize="9" fill="#FF3333">{'BLEED 0.125"'}</text>

      {/* Trim callout */}
      <line x1="60" y1="60" x2="-20" y2="40" stroke="#111111" strokeWidth="1" />
      <text x="-120" y="35" fontFamily="monospace" fontSize="9" fill="#111111">TRIM 5 × 8</text>

      {/* Gutter callout */}
      <line x1="120" y1="400" x2="-10" y2="400" stroke="#111111" strokeWidth="1" />
      <text x="-120" y="403" fontFamily="monospace" fontSize="9" fill="#111111">{'GUTTER 0.875"'}</text>

      {/* Baseline callout */}
      <line x1="480" y1="290" x2="620" y2="290" stroke="#111111" strokeWidth="1" />
      <text x="625" y="293" fontFamily="monospace" fontSize="9" fill="#111111">BASELINE 12pt</text>

      {/* Running head callout */}
      <line x1="480" y1="100" x2="620" y2="100" stroke="#111111" strokeWidth="1" />
      <text x="625" y="103" fontFamily="monospace" fontSize="9" fill="#111111">RUNNING HEAD</text>

      {/* Folio callout */}
      <line x1="320" y1="720" x2="620" y2="720" stroke="#111111" strokeWidth="1" />
      <text x="625" y="723" fontFamily="monospace" fontSize="9" fill="#111111">FOLIO</text>

      {/* Live area callout */}
      <line x1="120" y1="120" x2="-10" y2="120" stroke="#111111" strokeWidth="1" />
      <text x="-130" y="123" fontFamily="monospace" fontSize="9" fill="#111111">LIVE AREA</text>
    </svg>
  )
}
