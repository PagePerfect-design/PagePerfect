import Link from 'next/link'

// ── Template Data with exact font stacks and grid math ──────────
const TEMPLATES = [
  {
    key: 'symphony',
    name: 'Symphony',
    category: 'Academic',
    font: 'EB Garamond',
    sans: 'Libertinus Sans',
    baseline: '12pt',
    leading: '18pt',
    scale: '2.25×',
    specimen: 'The morning light filtered through the old windows of the library, casting long shadows across the desk.',
  },
  {
    key: 'paperback',
    name: 'Paperback',
    category: 'Trade',
    font: 'Alegreya Sans',
    sans: 'TeX Gyre Heros',
    baseline: '11pt',
    leading: '15.4pt',
    scale: '2.25×',
    specimen: 'She picked up the manuscript — three hundred pages of her life\'s work, still unfinished.',
  },
  {
    key: 'chronicle',
    name: 'Chronicle',
    category: 'Editorial',
    font: 'TeX Gyre Heros',
    sans: '—',
    baseline: '11pt',
    leading: '15.4pt',
    scale: '2.25×',
    specimen: 'The grid is a tool for ordering graphic design. All visual work benefits from structure.',
  },
  {
    key: 'matrix',
    name: 'Matrix',
    category: 'Corporate',
    font: 'Fira Sans',
    sans: '—',
    baseline: '11pt',
    leading: '15.4pt',
    scale: '2.25×',
    specimen: 'Quarterly results exceed projections across all divisions. Revenue growth maintained.',
  },
  {
    key: 'chicago',
    name: 'Chicago',
    category: 'Academic',
    font: 'ETbb (Bembo)',
    sans: 'Latin Modern Sans',
    baseline: '12pt',
    leading: '18pt',
    scale: '2.25×',
    specimen: 'As noted in the preceding chapter, the relationship between form and content remains central.',
  },
  {
    key: 'exhibit',
    name: 'Exhibit',
    category: 'Trade',
    font: 'Fira Sans',
    sans: 'TeX Gyre Adventor',
    baseline: '11pt',
    leading: '15.4pt',
    scale: '2.25×',
    specimen: 'Modern trade design prioritizes readability and whitespace. The page breathes.',
  },
  {
    key: 'avantgarde',
    name: 'Avant-Garde',
    category: 'Creative',
    font: 'Source Sans 3',
    sans: 'DejaVu Sans',
    baseline: '11pt',
    leading: '15.4pt',
    scale: '2.25×',
    specimen: 'Breaking convention requires understanding it first. The grid liberates, never constrains.',
  },
  {
    key: 'cinema',
    name: 'Cinema',
    category: 'Screenplay',
    font: 'TeX Gyre Cursor',
    sans: '—',
    baseline: '12pt',
    leading: '18pt',
    scale: '2.25×',
    specimen: 'INT. COFFEE SHOP — DAY. Alice sits alone. The morning light filters through the windows.',
  },
  {
    key: 'international',
    name: 'International',
    category: 'Swiss',
    font: 'TeX Gyre Heros',
    sans: 'TeX Gyre Heros',
    baseline: '11pt',
    leading: '15.4pt',
    scale: '2.25×',
    specimen: 'Die Neue Typografie. Clarity, order, and the reduction of form to its essential elements.',
  },
  {
    key: 'minimal',
    name: 'Minimal',
    category: 'Basic',
    font: 'Latin Modern',
    sans: '—',
    baseline: '12pt',
    leading: '18pt',
    scale: '2.25×',
    specimen: 'A lightweight template compatible with BasicTeX. No additional font packages required.',
  },
  {
    key: 'heirloom',
    name: 'Heirloom',
    category: 'Trade',
    font: 'Fira Sans',
    sans: 'DejaVu Serif',
    baseline: '11pt',
    leading: '15.4pt',
    scale: '2.25×',
    specimen: 'Heritage design for cookbooks and illustrated nonfiction. Generous margins, warm typography.',
  },
  {
    key: 'operator',
    name: 'Operator',
    category: 'Technical',
    font: 'Fira Sans',
    sans: '—',
    baseline: '11pt',
    leading: '15.4pt',
    scale: '2.25×',
    specimen: '$ npm install grid-system. Configuration: baseline must be divisible by leading value.',
  },
]

// ── Main Component ──────────────────────────────────────────────

export function TemplateGrid() {
  return (
    <section className="relative bg-[#FDFCF8] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-8">

        {/* ── Header ── */}
        <div className="mb-12 max-w-3xl md:mb-16">
          <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">
            Plates 1&ndash;12 &mdash; Typographic Systems
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] font-extrabold leading-[0.88] tracking-tighter text-[#111111]">
            Twelve systems.
            <br />
            Not themes.
          </h2>
          <p className="mt-5 max-w-lg font-body text-sm leading-[1.7] text-[#111111]/45">
            Each template is a mathematical typographic system &mdash; baseline grids,
            calculated heading scales, and grid-unit spacing. Every line locks to
            a M&uuml;ller-Brockmann grid.
          </p>
        </div>

        {/* ── Ruled Grid — gap trick: #111 bg shows through 2px gaps as rules ── */}
        <div className="border-2 border-[#111111] bg-[#111111]">
          <div className="grid grid-cols-1 gap-[2px] sm:grid-cols-2 lg:grid-cols-4">
            {TEMPLATES.map((t, i) => (
                <Link
                  key={t.key}
                  href={`/app?template=${t.key}`}
                  className="group block bg-[#FDFCF8] p-5 transition-colors duration-75 hover:bg-[#F5F4F0]"
                >
                  {/* Category + Name */}
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#111111]/25">
                      {t.category}
                    </span>
                    <span className="font-mono text-[8px] text-[#111111]/20">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold tracking-tight text-[#111111] md:text-xl">
                    {t.name}
                  </h3>

                  {/* Specimen text — tight crop of what this template looks like */}
                  <div className="mt-3 border-t border-[#111111]/10 pt-3">
                    <p className="font-body text-[11px] leading-[1.6] text-[#111111]/40 line-clamp-3">
                      {t.specimen}
                    </p>
                  </div>

                  {/* Font stack + grid math — the data typophiles want */}
                  <div className="mt-4 space-y-1 border-t border-[#111111]/8 pt-3">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[8px] text-[#111111]/30">Font</span>
                      <span className="font-mono text-[8px] text-[#111111]/50">{t.font}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[8px] text-[#111111]/30">Base</span>
                      <span className="font-mono text-[8px] text-[#111111]/50">{t.baseline} / {t.leading}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[8px] text-[#111111]/30">Scale</span>
                      <span className="font-mono text-[8px] text-[#111111]/50">{t.scale}</span>
                    </div>
                    {t.sans !== '—' && (
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono text-[8px] text-[#111111]/30">Sans</span>
                        <span className="font-mono text-[8px] text-[#111111]/50">{t.sans}</span>
                      </div>
                    )}
                  </div>
                </Link>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
