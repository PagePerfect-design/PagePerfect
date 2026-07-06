// ── Template Data with exact font stacks and grid math ──────────
export const TEMPLATES = [
  {
    key: 'symphony',
    name: 'Symphony',
    category: 'Academic',
    font: 'EB Garamond',
    sans: 'Libertinus Sans',
    baseline: '12pt',
    leading: '18pt',
    scale: '2.25×',
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
  },
  {
    key: 'verse',
    name: 'Verse',
    category: 'Poetry',
    font: 'EB Garamond',
    sans: 'Libertinus Sans',
    baseline: '11pt',
    leading: '15.4pt',
    scale: '2.25×',
  },
  {
    key: 'thesis',
    name: 'Thesis',
    category: 'Academic',
    font: 'Latin Modern',
    sans: 'Latin Modern Sans',
    baseline: '12pt',
    leading: '24pt',
    scale: '2.25×',
  },
  {
    key: 'memoir',
    name: 'Memoir',
    category: 'Fiction',
    font: 'Libre Baskerville',
    sans: 'TeX Gyre Heros',
    baseline: '11pt',
    leading: '15.4pt',
    scale: '2.25×',
  },
]

// ── Mini-Page Specimens ─────────────────────────────────────────
// Each renders a tiny page showing the actual layout architecture
// of that template. Uses available web fonts as proxies:
//   font-body  (Source Serif 4)  → serif templates
//   font-display (Inter Tight)  → sans-serif templates
//   font-mono  (IBM Plex Mono)  → monospace templates

export function SymphonySpecimen() {
  return (
    <div className="flex h-[130px] flex-col overflow-hidden bg-paper-stock px-[14%] py-[10%] font-body text-[5px] leading-[1.6] text-[#111]/60">
      <div className="mb-2 text-center">
        <span className="font-mono text-[3.5px] uppercase tracking-[0.2em] text-[#111]/20">Chapter Three</span>
        <div className="mt-0.5 font-display text-[8px] font-bold leading-tight text-[#111]">On Typography</div>
        <div className="mx-auto mt-1 h-px w-4 bg-[#111]/15" />
      </div>
      <p className="indent-[1em] text-justify">
        The morning light filtered through the old windows of the library, casting long shadows across the worn desk.
      </p>
      <p className="mt-[3px] indent-[1em] text-justify">
        She opened the manuscript and traced the baseline grid with her finger&thinsp;&mdash;&thinsp;every line fell precisely where it should.<sup className="text-[3px]">1</sup>
      </p>
      <div className="mt-auto text-center font-mono text-[3.5px] text-[#111]/15">7</div>
    </div>
  )
}

export function PaperbackSpecimen() {
  return (
    <div className="flex h-[130px] flex-col overflow-hidden bg-paper-stock px-[12%] py-[12%] font-display text-[5px] leading-[1.7] text-[#111]/55">
      <div className="mb-3">
        <div className="text-[14px] font-extrabold leading-none text-[#111]/[0.06]">1</div>
        <div className="mt-0.5 text-[7px] font-semibold leading-tight text-[#111]">The Departure</div>
      </div>
      <p>She picked up the manuscript&thinsp;&mdash;&thinsp;three hundred pages of her life&rsquo;s work, still unfinished.</p>
      <p className="mt-[3px]">The morning light had shifted by the time she looked up again.</p>
      <div className="mt-auto flex justify-between border-t border-[#111]/5 pt-0.5">
        <span className="font-mono text-[3px] uppercase tracking-[0.15em] text-[#111]/15">Author Name</span>
        <span className="font-mono text-[3px] text-[#111]/15">24</span>
      </div>
    </div>
  )
}

export function ChronicleSpecimen() {
  return (
    <div className="flex h-[130px] flex-col overflow-hidden bg-paper-stock p-[8%] font-display">
      <div className="mb-1 border-b border-[#111]" />
      <div className="mb-2 grid grid-cols-[1fr_2fr] gap-1">
        <div className="text-[11px] font-extrabold leading-none text-[#111]">01</div>
        <div className="text-[5px] font-bold uppercase leading-tight tracking-tight text-[#111]">
          The Grid<br />System
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-[6px]">
        <div className="text-justify text-[4px] leading-[1.5] text-[#111]/50">
          The grid is a tool for ordering graphic design. All visual work benefits from structure and proportion.
        </div>
        <div className="text-justify text-[4px] leading-[1.5] text-[#111]/50">
          Columns create rhythm across the page. The reader&rsquo;s eye flows naturally through ordered content.
        </div>
      </div>
      <div className="mt-auto border-t border-[#111]/10 pt-0.5">
        <span className="font-mono text-[3px] text-[#111]/20">Chronicle Editorial &middot; Vol. 1</span>
      </div>
    </div>
  )
}

export function MatrixSpecimen() {
  return (
    <div className="flex h-[130px] flex-col overflow-hidden bg-paper-stock px-[10%] py-[10%] font-display text-[4.5px] leading-[1.5] text-[#111]/55">
      <div className="mb-2">
        <div className="text-[6.5px] font-bold uppercase tracking-tight text-[#111]">Q4 Performance</div>
        <div className="mt-0.5 h-[1.5px] w-3 bg-[#111]" />
      </div>
      <div className="mb-2 space-y-[2px]">
        <div className="flex gap-1">
          <span className="text-[#111]/30">&bull;</span>
          <span>Revenue growth: 23% YoY</span>
        </div>
        <div className="flex gap-1">
          <span className="text-[#111]/30">&bull;</span>
          <span>Operating margin: 18.4%</span>
        </div>
        <div className="flex gap-1">
          <span className="text-[#111]/30">&bull;</span>
          <span>Active users: 2.1M (+340K)</span>
        </div>
      </div>
      <div className="mt-auto grid grid-cols-3 gap-1 border-t border-[#111]/10 pt-1">
        <div>
          <div className="font-mono text-[3px] uppercase text-[#111]/25">Revenue</div>
          <div className="text-[5px] font-bold text-[#111]">$4.2M</div>
        </div>
        <div>
          <div className="font-mono text-[3px] uppercase text-[#111]/25">Margin</div>
          <div className="text-[5px] font-bold text-[#111]">18.4%</div>
        </div>
        <div>
          <div className="font-mono text-[3px] uppercase text-[#111]/25">Users</div>
          <div className="text-[5px] font-bold text-[#111]">2.1M</div>
        </div>
      </div>
    </div>
  )
}

export function ChicagoSpecimen() {
  return (
    <div className="flex h-[130px] flex-col overflow-hidden bg-paper-stock px-[15%] py-[12%] font-body text-[5px] leading-[1.6] text-[#111]/60">
      <div className="mb-3 text-center">
        <span className="text-[4px] uppercase tracking-[0.25em] text-[#111]/25">II</span>
        <div className="mt-1 text-[7px] font-bold leading-tight text-[#111]">Form and Content</div>
      </div>
      <p className="indent-[1em] text-justify">
        As noted in the preceding chapter, the relationship between form and content remains central to any discussion of typography.<sup className="text-[3px]">14</sup>
      </p>
      <div className="mt-auto border-t border-[#111]/10 pt-1">
        <p className="text-[3.5px] leading-[1.4] text-[#111]/30">
          <sup>14</sup>&thinsp;Bringhurst, <em>The Elements of Typographic Style</em>, 4th ed. (Seattle: Hartley &amp; Marks, 2012), 28.
        </p>
      </div>
    </div>
  )
}

export function ExhibitSpecimen() {
  return (
    <div className="flex h-[130px] flex-col overflow-hidden bg-paper-stock px-[10%] py-[14%] font-display text-[5px] leading-[1.8] text-[#111]/50">
      <div className="mb-4">
        <div className="text-[10px] font-extrabold leading-[0.9] tracking-tight text-[#111]">
          White<br />Space
        </div>
      </div>
      <p>Modern trade design prioritizes the space between elements as much as the elements themselves.</p>
      <p className="mt-[4px]">The page breathes. The reader rests.</p>
      <div className="mt-auto">
        <span className="font-mono text-[3px] uppercase tracking-[0.15em] text-[#111]/15">Exhibit &middot; 12</span>
      </div>
    </div>
  )
}

export function AvantGardeSpecimen() {
  return (
    <div className="relative flex h-[130px] flex-col overflow-hidden bg-paper-stock px-[8%] py-[8%] font-display">
      <div className="mb-1 h-[2px] bg-[#111]" />
      <div className="text-[16px] font-extrabold leading-[0.85] tracking-tighter text-[#111]">
        BREAK
      </div>
      <div className="text-[16px] font-extrabold leading-[0.85] tracking-tighter text-[#111]/10">
        RULES
      </div>
      <div className="mt-2 h-px bg-[#111]/20" />
      <p className="mt-1 max-w-[70%] text-[4px] leading-[1.5] text-[#111]/45">
        Convention exists to be understood, then discarded. The grid liberates.
      </p>
      <div className="mt-auto flex items-end justify-between">
        <span className="font-mono text-[3px] uppercase tracking-[0.2em] text-[#111]/20">AG&mdash;01</span>
        <div className="h-[2px] w-8 bg-[#111]" />
      </div>
    </div>
  )
}

export function CinemaSpecimen() {
  return (
    <div className="flex h-[130px] flex-col overflow-hidden bg-paper-stock px-[15%] py-[10%] font-mono text-[4.5px] leading-[1.5] text-[#111]/65">
      <div className="mb-2 uppercase text-[#111]/40">
        Int. Coffee Shop &mdash; Day
      </div>
      <p className="mb-2">
        A small cafe on a quiet street. Morning light through the windows. ALICE sits alone at a corner table.
      </p>
      <div className="mb-0.5 pl-[30%] text-center uppercase text-[#111]/70">
        Alice
      </div>
      <div className="pl-[15%] pr-[15%]">
        I&rsquo;ve been waiting for this manuscript my entire life.
      </div>
      <div className="mt-2 pl-[15%] pr-[15%] text-[4px] italic text-[#111]/35">
        (she turns the page)
      </div>
    </div>
  )
}

export function InternationalSpecimen() {
  return (
    <div className="flex h-[130px] flex-col overflow-hidden bg-paper-stock p-[8%] font-display">
      <div className="mb-1 flex items-baseline justify-between border-b border-[#111] pb-0.5">
        <span className="text-[4px] font-bold uppercase tracking-[0.15em] text-[#111]/40">Typografie</span>
        <span className="text-[8px] font-extrabold leading-none text-[#111]">01</span>
      </div>
      <div className="mt-1 text-[10px] font-extrabold leading-[0.9] tracking-tight text-[#111]">
        Die Neue<br />Typografie
      </div>
      <div className="mt-2 grid flex-1 grid-cols-2 gap-[6px]">
        <p className="text-[3.5px] leading-[1.5] text-[#111]/45">
          Klarheit, Ordnung und die Reduktion der Form auf ihre wesentlichen Elemente.
        </p>
        <p className="text-[3.5px] leading-[1.5] text-[#111]/45">
          Clarity, order, and the reduction of form to its essential elements.
        </p>
      </div>
      <div className="mt-auto h-px bg-[#111]" />
    </div>
  )
}

export function MinimalSpecimen() {
  return (
    <div className="flex h-[130px] flex-col overflow-hidden bg-paper-stock px-[14%] py-[12%] font-body text-[5px] leading-[1.65] text-[#111]/55">
      <div className="mb-3">
        <div className="text-[7px] font-bold text-[#111]">1&ensp;Introduction</div>
      </div>
      <p className="indent-[1em] text-justify">
        A lightweight template requiring no additional font packages. Compatible with BasicTeX installations.
      </p>
      <p className="mt-[3px] indent-[1em] text-justify">
        The design follows traditional LaTeX conventions: Computer Modern proportions, standard margins, clean hierarchy.
      </p>
      <div className="mt-auto text-center text-[4px] text-[#111]/20">1</div>
    </div>
  )
}

export function HeirloomSpecimen() {
  return (
    <div className="flex h-[130px] flex-col overflow-hidden bg-paper-stock px-[10%] py-[10%]">
      <div className="mb-1 text-center">
        <div className="font-mono text-[3px] tracking-[0.3em] text-[#111]/20">&bull; &bull; &bull;</div>
        <div className="mt-1 font-body text-[8px] font-bold italic leading-tight text-[#111]">Heritage Bread</div>
        <div className="mx-auto mt-0.5 h-px w-6 bg-[#111]/10" />
      </div>
      <div className="grid flex-1 grid-cols-[2fr_3fr] gap-2">
        <div className="flex flex-col justify-start">
          <div className="h-10 w-full bg-[#111]/[0.04]" />
          <span className="mt-0.5 font-mono text-[3px] italic text-[#111]/20">Fig. 1</span>
        </div>
        <div className="font-display text-[4.5px] leading-[1.6] text-[#111]/50">
          <p>Combine the flour and salt in a large bowl. The heritage grain requires a longer fermentation.</p>
          <p className="mt-[3px] font-body text-[3.5px] italic text-[#111]/30">Serves 4&ensp;&middot;&ensp;45 min prep</p>
        </div>
      </div>
      <div className="mt-auto border-t border-[#111]/10 pt-0.5">
        <span className="font-mono text-[3px] text-[#111]/15">Heirloom Kitchen &middot; 42</span>
      </div>
    </div>
  )
}

export function OperatorSpecimen() {
  return (
    <div className="flex h-[130px] flex-col overflow-hidden bg-paper-stock px-[10%] py-[10%] font-display text-[4.5px] leading-[1.5] text-[#111]/55">
      <div className="mb-2">
        <div className="text-[6px] font-bold text-[#111]">3.2&ensp;Configuration</div>
        <div className="mt-0.5 h-px w-full bg-[#111]/10" />
      </div>
      <p className="mb-2">
        The baseline value must be divisible by the leading. Set the grid in your config:
      </p>
      <div className="mb-2 bg-[#111]/[0.04] px-1.5 py-1">
        <code className="font-mono text-[4px] leading-[1.6] text-[#111]/60">
          <span className="text-[#111]/30">$</span> grid.baseline = 11<br />
          <span className="text-[#111]/30">$</span> grid.leading &nbsp;= 15.4<br />
          <span className="text-[#111]/30">$</span> grid.compile()
        </code>
      </div>
      <div className="mt-auto flex justify-between">
        <span className="font-mono text-[3px] uppercase tracking-[0.15em] text-[#111]/20">Operator Manual</span>
        <span className="font-mono text-[3px] text-[#111]/20">3&ndash;7</span>
      </div>
    </div>
  )
}

export function VerseSpecimen() {
  return (
    <div className="flex h-[130px] flex-col overflow-hidden bg-paper-stock px-[18%] py-[14%] font-body text-[5px] leading-[1.8] text-[#111]/55">
      <div className="mb-3 text-center">
        <div className="font-body text-[7px] italic leading-tight text-[#111]">Aubade</div>
        <div className="mx-auto mt-1 h-px w-3 bg-[#111]/10" />
      </div>
      <p className="text-center">I work all day, and get half-drunk at night.</p>
      <p className="mt-[3px] text-center">Waking at four to soundless dark, I stare.</p>
      <p className="mt-[3px] text-center">In time the curtain-edges will grow light.</p>
      <p className="mt-[3px] text-center">Till then I see what&rsquo;s really always there:</p>
      <div className="mt-auto text-center font-mono text-[3.5px] text-[#111]/15">3</div>
    </div>
  )
}

export function ThesisSpecimen() {
  return (
    <div className="flex h-[130px] flex-col overflow-hidden bg-paper-stock px-[12%] py-[10%] font-body text-[5px] leading-[2] text-[#111]/55">
      <div className="mb-2">
        <div className="text-[6px] font-bold text-[#111]">2.1&ensp;Literature Review</div>
      </div>
      <p className="indent-[1em] text-justify">
        Previous research has established a strong correlation between typographic quality and reader comprehension (Smith, 2019; Johnson &amp; Lee, 2021).
      </p>
      <p className="mt-[3px] indent-[1em] text-justify">
        However, the relationship between baseline grids and readability remains underexplored in the existing literature.
      </p>
      <div className="mt-auto text-right font-mono text-[3.5px] text-[#111]/15">12</div>
    </div>
  )
}

export function MemoirSpecimen() {
  return (
    <div className="flex h-[130px] flex-col overflow-hidden bg-paper-stock px-[14%] py-[12%] font-body text-[5px] leading-[1.6] text-[#111]/55">
      <div className="mb-3 text-center">
        <div className="font-mono text-[3.5px] text-[#111]/20">3</div>
        <div className="mt-0.5 text-[7px] italic leading-tight text-[#111]">The House on Elm Street</div>
        <div className="mx-auto mt-1 h-px w-4 bg-[#111]/10" />
      </div>
      <p className="indent-[1em]">
        I remember the wallpaper more than anything&thinsp;&mdash;&thinsp;faded yellow roses that seemed to breathe in the afternoon light.
      </p>
      <p className="mt-[3px] indent-[1em]">
        My grandmother would sit by the window, her tea growing cold, watching the street below.
      </p>
      <div className="mt-auto text-center font-mono text-[3.5px] text-[#111]/15">27</div>
    </div>
  )
}

// Map template keys to their specimen components
export const SPECIMENS: Record<string, () => React.JSX.Element> = {
  symphony: SymphonySpecimen,
  paperback: PaperbackSpecimen,
  chronicle: ChronicleSpecimen,
  matrix: MatrixSpecimen,
  chicago: ChicagoSpecimen,
  exhibit: ExhibitSpecimen,
  avantgarde: AvantGardeSpecimen,
  cinema: CinemaSpecimen,
  international: InternationalSpecimen,
  minimal: MinimalSpecimen,
  heirloom: HeirloomSpecimen,
  operator: OperatorSpecimen,
  verse: VerseSpecimen,
  thesis: ThesisSpecimen,
  memoir: MemoirSpecimen,
}