const CAPABILITIES = [
  {
    category: 'Output',
    items: [
      'PDF/X-1a compliant output for offset printing',
      'Embedded fonts — no substitution, no missing glyphs',
      'Correct bleed, trim marks, and safe zones',
      'Ghostscript post-processing for IngramSpark/offset',
    ],
  },
  {
    category: 'Typography',
    items: [
      'Baseline grid conformance on every page',
      'Golden-ratio heading scale (2.25× / 1.75× / 1.375×)',
      'Paragraph-level line break optimization',
      'Widow/orphan control and hyphenation rules',
    ],
  },
  {
    category: 'Platform',
    items: [
      'Amazon KDP — spine width, gutter, trim validation',
      'IngramSpark — PDF/X-1a, ICC profile compliance',
      'Lulu xPress — API integration, cost estimation',
      '19 page sizes from Mass Market to Crown Quarto',
    ],
  },
  {
    category: 'Engine',
    items: [
      'LuaLaTeX compilation with 45-second timeout',
      'Pandoc Markdown conversion with citeproc',
      'BibTeX/CSL citation and bibliography processing',
      'DOCX-to-Markdown conversion via Pandoc',
    ],
  },
]

const SPECS = [
  { label: 'Compiler', value: 'LuaLaTeX (TeX Live)' },
  { label: 'Converter', value: 'Pandoc 3.x' },
  { label: 'Post-proc', value: 'Ghostscript 10.x' },
  { label: 'Grid', value: 'Müller-Brockmann (7 presets)' },
  { label: 'Baselines', value: '11pt (trade) / 12pt (academic)' },
  { label: 'Scale', value: '2.25× / 1.75× / 1.375× / 1× / 0.875×' },
  { label: 'Max input', value: '2 MB Markdown / 10 MB DOCX' },
  { label: 'Timeout', value: '45,000 ms' },
]

export function Engineering() {
  return (
    <section className="relative border-t-2 border-[#111111] bg-[#FDFCF8] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-8">

        {/* ── Header ── */}
        <div className="mb-12 max-w-3xl md:mb-16">
          <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">
            Engineering
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] font-extrabold leading-[0.88] tracking-tighter text-[#111111]">
            Industrial grade.
          </h2>
          <p className="mt-5 max-w-lg font-body text-sm leading-[1.7] text-[#111111]/45">
            Not a wrapper around a PDF library. A full typesetting pipeline
            built on the same tools used by academic publishers.
          </p>
        </div>

        {/* ── Capabilities Grid — gap trick for clean rules ── */}
        <div className="border-2 border-[#111111] bg-[#111111]">
          <div className="grid grid-cols-1 gap-[2px] sm:grid-cols-2">
          {CAPABILITIES.map((cap) => (
            <div
              key={cap.category}
              className="bg-[#FDFCF8] p-6 md:p-8"
            >
              <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">
                {cap.category}
              </p>
              <ul className="space-y-2">
                {cap.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 font-mono text-[11px] leading-[1.5] text-[#111111]/60">
                    <span className="mt-px text-[#111111]/25">[&thinsp;]</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          </div>
        </div>

        {/* ── Specification Table ── */}
        <div className="mt-12">
          <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">
            Specification
          </p>
          <div className="border-t-2 border-b-2 border-[#111111]">
            {SPECS.map((spec, i) => (
              <div
                key={spec.label}
                className={[
                  'grid grid-cols-[8rem_1fr] py-2.5 md:grid-cols-[10rem_1fr]',
                  i < SPECS.length - 1 ? 'border-b border-[#111111]/8' : '',
                ].filter(Boolean).join(' ')}
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111]/30">
                  {spec.label}
                </span>
                <span className="font-mono text-[10px] text-[#111111]/60">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
