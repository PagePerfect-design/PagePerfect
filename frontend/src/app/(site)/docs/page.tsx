import Container from '@/components/Container'
import Section from '@/components/Section'
import CopyCitation from '@/components/CopyCitation'
import AuthorGuideTools from '@/components/AuthorGuideTools'
import RequirementsCheck from './RequirementsCheck'

export const metadata = {
  title: 'Docs — PagePerfect',
  description: 'Template reference, KDP publishing guide, troubleshooting, and citation help for PagePerfect.',
}

/* ─── Template data ─── */

const TEMPLATE_DOCS = [
  {
    key: 'symphony',
    name: 'Symphony',
    subtitle: 'The Academic Monograph',
    category: 'Academic',
    description: 'Built on the Van de Graaf Canon — the medieval page construction that Tschichold proved generates optically perfect margins. Symphony is the template for work that must be taken seriously.',
    fonts: { primary: 'EB Garamond', secondary: 'Libertinus Sans', mono: 'DejaVu Sans Mono' },
    geometry: { baseSize: '12pt', leading: '1.15', indent: '1.5em', parskip: '0pt' },
    features: ['Van de Graaf Canon margins', 'Ornamental chapter headings with centered rule', 'Oxblood (#800020) accent palette', 'Hanging footnotes via footmisc', 'Verso/recto running heads with small-caps title', 'OldStyle numerals throughout'],
    bestFor: 'Dissertations, monographs, academic books, scholarly journals',
  },
  {
    key: 'chicago',
    name: 'Chicago',
    subtitle: 'The University Press Monograph',
    category: 'Academic',
    description: 'Strict adherence to the Chicago Manual of Style. ETbb (the digital Bembo) carries the gravitas of 500 years of printing tradition. Every margin, indent, and footnote follows the canon.',
    fonts: { primary: 'ETbb', secondary: null, mono: null },
    geometry: { baseSize: '11pt', leading: '1.15', indent: '2em', parskip: '0pt' },
    features: ['ETbb (Bembo) with OldStyle numerals', 'True footnotes with 2-inch separator rule', 'CMOS running heads: title (verso), chapter (recto)', 'Centered small-caps chapter headings', '2em paragraph indent (CMOS standard)', 'Block quotes at \\small with 2em left margin'],
    bestFor: 'University press submissions, humanities theses, CMOS-compliant publications',
  },
  {
    key: 'paperback',
    name: 'Paperback',
    subtitle: 'The Cinematic Page-Turner',
    category: 'Fiction',
    description: 'Designed for the books you can\'t put down. Alegreya Sans provides the invisible reading experience of commercial fiction, while cinematic chapter openings set the stage for each scene.',
    fonts: { primary: 'Alegreya Sans', secondary: 'TeX Gyre Heros', mono: null },
    geometry: { baseSize: '11pt', leading: '1.3', indent: '1.5em', parskip: '0pt' },
    features: ['Cinematic chapter headings: 60pt grey number + bold title', 'Scene break ornament (centered asterism)', '1.5em fiction-standard paragraph indent', 'Small-caps running headers', 'Clean, transparent reading typography', 'Part/chapter hierarchy support'],
    bestFor: 'Novels, short story collections, creative nonfiction, memoir',
  },
  {
    key: 'chronicle',
    name: 'Chronicle',
    subtitle: 'The Journalism Template',
    category: 'Editorial',
    description: 'Swiss International Style applied to editorial content. TeX Gyre Heros (Helvetica) with heavy rules, block paragraphs, and pull-quote blockquotes. The template of record.',
    fonts: { primary: 'TeX Gyre Heros', secondary: null, mono: 'Fira Mono' },
    geometry: { baseSize: '11pt', leading: '1.3', indent: '0pt', parskip: '0.15in' },
    features: ['Flush left, ragged right (\\hyphenpenalty=200)', '3pt heavy rules above sections', 'Uppercase tracked subsections (LetterSpace=5)', 'Pull-quote blockquotes with 3pt left vrule', '2pt rule in page headers', 'Block paragraph style (no indent, 0.15in skip)'],
    bestFor: 'Journalism, editorial collections, newsletters, reports, white papers',
  },
  {
    key: 'exhibit',
    name: 'Exhibit',
    subtitle: 'The White Cube',
    category: 'Trade',
    description: 'Inspired by gallery exhibition catalogs where the white space is the design. Extreme breathing room, ghost-number chapter openings, and typography that disappears to let the content speak.',
    fonts: { primary: 'Fira Sans', secondary: 'TeX Gyre Adventor', mono: 'Fira Mono' },
    geometry: { baseSize: '10pt', leading: '1.5', indent: '0pt', parskip: '0.2in' },
    features: ['80pt ghost grey chapter numbers (opacity 0.08)', 'Uppercase tracked section headers (no bold)', 'Extreme whitespace: 1.5 line height + 0.2in parskip', 'Ragged right with no hyphenation', 'Minimal footer page numbers only', 'Clean hierarchy without decorative elements'],
    bestFor: 'Art catalogs, design portfolios, photography books, exhibition guides',
  },
  {
    key: 'matrix',
    name: 'Matrix',
    subtitle: 'The Annual Report',
    category: 'Business',
    description: 'Swiss corporate typography: Fira Sans with lining (tabular) figures for financial data, MidnightBlue accent palette, and booktabs for professional tables.',
    fonts: { primary: 'Fira Sans', secondary: null, mono: 'Fira Mono' },
    geometry: { baseSize: '10pt', leading: '1.35', indent: '0pt', parskip: '6pt' },
    features: ['Lining tabular figures for financial data', 'MidnightBlue (#191970) corporate palette', 'Executive summary blockquotes with blue left border', 'booktabs-formatted tables', 'Tight uppercase tracked section headings', 'Running heads with small caps'],
    bestFor: 'Annual reports, business proposals, corporate documentation, financial reports',
  },
  {
    key: 'avantgarde',
    name: 'Avant-Garde',
    subtitle: 'The Manifesto',
    category: 'Creative',
    description: 'For content that breaks rules on purpose. 120pt ghost chapter numbers, brutalist blockquotes sandwiched between heavy rules, and the restless energy of an unresolved grid.',
    fonts: { primary: 'Source Sans 3', secondary: 'DejaVu Sans', mono: 'TeX Gyre Cursor' },
    geometry: { baseSize: '11pt', leading: '1.35', indent: '0pt', parskip: '10pt' },
    features: ['120pt ghost grey chapter numbers', 'Brutalist blockquotes: 2pt rules above and below', 'Ragged right with zero hyphenation', 'Large 20pt uppercase chapter titles', '10pt paragraph skip creates open texture', 'Deliberately unresolved visual tension'],
    bestFor: 'Manifestos, experimental fiction, zines, art books, creative essays',
  },
  {
    key: 'minimal',
    name: 'Minimal',
    subtitle: 'The Source Code',
    category: 'Basic',
    description: 'Radical compatibility. Zero external dependencies — no fontspec, no custom fonts. Compiles on pdflatex, xelatex, and lualatex. Latin Modern: the Knuthian Ideal perfected.',
    fonts: { primary: 'Latin Modern', secondary: null, mono: null },
    geometry: { baseSize: '12pt', leading: '1.5', indent: '0pt', parskip: '6pt' },
    features: ['No fontspec — works on any TeX installation', 'Latin Modern (Computer Modern perfected)', 'Standard \\maketitle page', 'Plain page style with centered page numbers', '1.5 line spacing for drafts', 'Maximum portability across systems'],
    bestFor: 'Drafts, submissions, BasicTeX users, maximum compatibility scenarios',
  },
  {
    key: 'international',
    name: 'International',
    subtitle: 'The Swiss Standard',
    category: 'Design',
    description: 'Muller-Brockmann\'s modular grid system — one font, no italics, visible structure. Hierarchy achieved purely through size and weight. "Italics are emotional corruption."',
    fonts: { primary: 'TeX Gyre Heros', secondary: null, mono: 'TeX Gyre Cursor' },
    geometry: { baseSize: '9pt', leading: '1.25', indent: '0pt', parskip: '8pt' },
    features: ['Single font family only (TeX Gyre Heros)', 'No italics used anywhere', 'Flush left, ragged right (strict rule)', '0.5pt rules above sections', '7pt letter-spaced uppercase headers', 'Dense Swiss grid: 9pt/11pt base'],
    bestFor: 'Design portfolios, architecture proposals, brand guidelines, manifestos',
  },
  {
    key: 'cinema',
    name: 'Cinema',
    subtitle: 'The Hollywood Standard',
    category: 'Screenplay',
    description: 'Production-ready screenplay format. Courier 12pt is non-negotiable — the industry\'s "1 page = 1 minute" rule depends on it. Every margin follows the Hollywood Standard.',
    fonts: { primary: 'TeX Gyre Cursor', secondary: null, mono: null },
    geometry: { baseSize: '12pt', leading: '1.0', indent: '0pt', parskip: '12pt' },
    features: ['TeX Gyre Cursor (Courier clone) — industry standard', 'Hardcoded margins: 1.5in left (3-hole punch), 1.0in right', 'Single-spaced (1 page = 1 minute rule)', 'UPPERCASE sluglines (scene headings)', 'Narrow dialogue blocks (1.0in left indent)', 'Title page with "by" attribution line'],
    bestFor: 'Screenplays, teleplays, stage plays, indie film scripts',
  },
  {
    key: 'heirloom',
    name: 'Heirloom',
    subtitle: 'The Modern Gastronomy Book',
    category: 'Cookbook',
    description: 'Cookbook format with mise-en-place grid separation. Recipes are cards, ingredients are highlighted blocks, and steps are boldly numbered. Warm earth tones evoke the kitchen.',
    fonts: { primary: 'Fira Sans', secondary: 'DejaVu Serif', mono: 'Fira Mono' },
    geometry: { baseSize: '11pt', leading: '1.4', indent: '0pt', parskip: '8pt' },
    features: ['DejaVu Serif slab-serif headers (warm, robust)', 'Ingredient blocks in light grey colorboxes', 'Bold numbered steps for recipe procedures', 'Warm SaddleBrown (#8B4513) palette', 'Section-separating horizontal rules', 'Uppercase tracked subsections for categories'],
    bestFor: 'Cookbooks, recipe collections, food blogs, family recipe books',
  },
  {
    key: 'operator',
    name: 'Operator',
    subtitle: 'The Engineering Manual',
    category: 'Technical',
    description: 'Built for developer documentation, O\'Reilly-style. Semantic admonition boxes (Warning, Info, Code) with colored left borders, structured hierarchy, and Fira Sans/Mono typography.',
    fonts: { primary: 'Fira Sans', secondary: null, mono: 'Fira Mono' },
    geometry: { baseSize: '10pt', leading: '1.4', indent: '0pt', parskip: '8pt' },
    features: ['Warning admonition box (red left border)', 'Info admonition box (blue left border)', 'Code admonition box (grey background)', 'Navy blue (#003366) heading palette', 'Numbered section hierarchy', 'Blockquotes automatically render as Info boxes'],
    bestFor: 'Developer docs, technical manuals, API references, engineering guides',
  },
]

const KDP_TRIM_SIZES = [
  { size: '5 x 8"', code: 'amazonFiveByEight', bestFor: 'Novellas, poetry, compact fiction' },
  { size: '5.5 x 8.5"', code: 'fiveFiveByEightFive', bestFor: 'Standard fiction, memoir' },
  { size: '6 x 9"', code: 'amazonSixByNine', bestFor: 'Nonfiction, trade standard' },
  { size: '7 x 10"', code: 'amazonSevenByTen', bestFor: 'Textbooks, technical books' },
  { size: '8.5 x 11"', code: 'amazonEightFiveByEleven', bestFor: 'Workbooks, cookbooks, manuals' },
]

const GUTTER_TABLE = [
  { pages: '24–150', gutter: '0.375"' },
  { pages: '151–300', gutter: '0.5"' },
  { pages: '301–500', gutter: '0.625"' },
  { pages: '501–828', gutter: '0.75"' },
]

export default function DocsPage() {
  return (
    <main id="main">
      <Container>
        <Section>
          <h1 className="font-display text-h1 font-bold tracking-tight text-text-primary mb-2">Documentation</h1>
          <p className="p mt-3">
            Quick tips to get your manuscript compiling smoothly. Use the helpers below to copy a valid
            citation and test that your bibliography is set up.
          </p>
          <div className="mt-6"><CopyCitation /></div>
          <div className="mt-4"><AuthorGuideTools /></div>
          <div className="mt-6"><RequirementsCheck /></div>
        </Section>

        {/* ══════════════════════════════════════════════════════
            TEMPLATE REFERENCE — 12 Typographic Systems
            ══════════════════════════════════════════════════════ */}
        <Section className="pt-0">
          <div className="mb-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-text-tertiary mb-3">Reference</p>
            <h2 className="font-display text-h2 font-bold tracking-tight text-text-primary">Twelve Typographic Systems</h2>
            <p className="p mt-3 max-w-2xl">
              Every template is a complete typographic system — not a theme. Each implements specific design
              principles: baseline grids, proportional scales, calculated margins, and intentional font stacks.
            </p>
          </div>

          <div className="grid gap-6">
            {TEMPLATE_DOCS.map((t) => (
              <div key={t.key} className="card p-6 md:p-8">
                <div className="flex flex-wrap items-baseline gap-3 mb-1">
                  <h3 className="font-display text-xl font-bold text-text-primary">{t.name}</h3>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent bg-accent-soft px-2 py-0.5 rounded">{t.category}</span>
                </div>
                <p className="font-mono text-[11px] text-text-tertiary mb-4">{t.subtitle}</p>
                <p className="p mb-6">{t.description}</p>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Font Stack */}
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary mb-2">Font Stack</p>
                    <p className="text-sm text-text-primary font-medium">{t.fonts.primary}</p>
                    {t.fonts.secondary && <p className="text-sm text-text-secondary">+ {t.fonts.secondary}</p>}
                    {t.fonts.mono && <p className="text-sm text-text-secondary font-mono">{t.fonts.mono}</p>}
                  </div>

                  {/* Geometry */}
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary mb-2">Geometry</p>
                    <div className="space-y-1 text-sm text-text-secondary">
                      <p>Base: {t.geometry.baseSize}</p>
                      <p>Leading: {t.geometry.leading}</p>
                      <p>Indent: {t.geometry.indent}</p>
                      <p>Par skip: {t.geometry.parskip}</p>
                    </div>
                  </div>

                  {/* Best For */}
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary mb-2">Best For</p>
                    <p className="text-sm text-text-secondary">{t.bestFor}</p>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-tertiary mb-3">Key Features</p>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {t.features.map((f, i) => (
                      <p key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-accent shrink-0" />
                        {f}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════
            AMAZON KDP PUBLISHING GUIDE
            ══════════════════════════════════════════════════════ */}
        <Section className="pt-0">
          <div className="mb-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-text-tertiary mb-3">Publishing</p>
            <h2 className="font-display text-h2 font-bold tracking-tight text-text-primary">Amazon KDP Guide</h2>
            <p className="p mt-3 max-w-2xl">
              PagePerfect supports all five Amazon KDP trim sizes with dynamic gutter calculation and spine width estimation.
              Select any KDP page size in the editor to generate compliant interior PDFs.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Trim Sizes */}
            <div className="card p-6">
              <h3 className="font-display text-lg font-bold text-text-primary mb-4">KDP Trim Sizes</h3>
              <div className="space-y-3">
                {KDP_TRIM_SIZES.map((s) => (
                  <div key={s.code} className="flex items-baseline justify-between border-b border-border pb-2 last:border-0">
                    <span className="font-mono text-sm text-text-primary">{s.size}</span>
                    <span className="text-sm text-text-secondary">{s.bestFor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Gutter */}
            <div className="card p-6">
              <h3 className="font-display text-lg font-bold text-text-primary mb-4">Dynamic Gutter (Inside Margin)</h3>
              <p className="p text-sm mb-4">
                KDP requires minimum inside margins based on page count to accommodate binding.
              </p>
              <div className="space-y-3">
                {GUTTER_TABLE.map((g) => (
                  <div key={g.pages} className="flex items-baseline justify-between border-b border-border pb-2 last:border-0">
                    <span className="font-mono text-sm text-text-primary">{g.pages} pages</span>
                    <span className="font-mono text-sm text-accent">{g.gutter}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Spine Width Calculator Info */}
          <div className="card p-6 mt-6">
            <h3 className="font-display text-lg font-bold text-text-primary mb-3">Spine Width Calculation</h3>
            <p className="p text-sm mb-4">
              Spine width determines your cover template dimensions. PagePerfect calculates this automatically
              in the Press stage based on your word count.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-surface-subtle p-4 rounded-lg border border-[rgba(255,255,255,0.04)]">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary mb-1">White Paper (55#)</p>
                <p className="text-sm text-text-primary">Page count &times; 0.002252&quot;</p>
                <p className="text-xs text-text-tertiary mt-1">Example: 300 pages = 0.676&quot; spine</p>
              </div>
              <div className="bg-surface-subtle p-4 rounded-lg border border-[rgba(255,255,255,0.04)]">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary mb-1">Cream Paper (60#)</p>
                <p className="text-sm text-text-primary">Page count &times; 0.0025&quot;</p>
                <p className="text-xs text-text-tertiary mt-1">Example: 300 pages = 0.750&quot; spine</p>
              </div>
            </div>
          </div>

          {/* API Endpoints */}
          <div className="card p-6 mt-6">
            <h3 className="font-display text-lg font-bold text-text-primary mb-3">KDP API Endpoints</h3>
            <p className="p text-sm mb-4">
              Use these endpoints to integrate spine and gutter calculations into your workflow.
            </p>
            <div className="space-y-3">
              <div className="bg-surface-subtle p-4 rounded-lg border border-[rgba(255,255,255,0.04)]">
                <code className="text-accent text-sm font-mono">GET /api/kdp/spine?pages=300</code>
                <p className="text-xs text-text-tertiary mt-1">Returns spine width for both paper stocks and recommended gutter</p>
              </div>
              <div className="bg-surface-subtle p-4 rounded-lg border border-[rgba(255,255,255,0.04)]">
                <code className="text-accent text-sm font-mono">GET /api/kdp/gutter?pages=300</code>
                <p className="text-xs text-text-tertiary mt-1">Returns minimum inside margin for the given page count</p>
              </div>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════
            PUBLISHING AUTOMATION
            ══════════════════════════════════════════════════════ */}
        <Section className="pt-0">
          <div className="mb-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-text-tertiary mb-3">Automation</p>
            <h2 className="font-display text-h2 font-bold tracking-tight text-text-primary">Publishing Automation</h2>
            <p className="p mt-3 max-w-2xl">
              PagePerfect automates the entire path from Markdown to printed book. Pre-flight validation
              catches rejection-causing errors before submission, while platform-specific exports ensure compliance.
            </p>
          </div>

          <div className="grid gap-6">
            {/* Pre-flight Validator */}
            <div className="card p-6">
              <div className="flex items-baseline gap-3 mb-4">
                <h3 className="font-display text-lg font-bold text-text-primary">Pre-flight Validator</h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Live</span>
              </div>
              <p className="p text-sm mb-4">
                The Press stage runs real-time pre-flight checks against your target platform&apos;s requirements.
                Select Amazon KDP, IngramSpark, or Lulu to validate margins, page count, gutter, trim size, and font embedding.
              </p>
              <div className="bg-surface-subtle p-4 rounded-lg border border-[rgba(255,255,255,0.04)]">
                <code className="text-accent text-sm font-mono">POST /api/preflight</code>
                <p className="text-xs text-text-tertiary mt-1">Body: &#123; pageSize, marginPreset, template, wordCount, platform: &quot;kdp&quot; | &quot;ingram&quot; | &quot;lulu&quot; &#125;</p>
              </div>
            </div>

            {/* Cover Dimensions */}
            <div className="card p-6">
              <div className="flex items-baseline gap-3 mb-4">
                <h3 className="font-display text-lg font-bold text-text-primary">Cover Dimensions Calculator</h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Live</span>
              </div>
              <p className="p text-sm mb-4">
                Calculates exact cover template dimensions including spine width, bleed zones, and safety margins.
                Displayed automatically in the Press stage based on your page count and paper stock.
              </p>
              <div className="bg-surface-subtle p-4 rounded-lg border border-[rgba(255,255,255,0.04)]">
                <code className="text-accent text-sm font-mono">GET /api/cover-dimensions?width=6&amp;height=9&amp;pages=300&amp;paper=white</code>
                <p className="text-xs text-text-tertiary mt-1">Returns full cover width/height, spine, bleed, safety margins, and breakdown</p>
              </div>
            </div>

            {/* PDF/X-1a */}
            <div className="card p-6">
              <div className="flex items-baseline gap-3 mb-4">
                <h3 className="font-display text-lg font-bold text-text-primary">PDF/X-1a Export</h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">IngramSpark</span>
              </div>
              <p className="p text-sm mb-4">
                IngramSpark requires PDF/X-1a:2001 compliance — CMYK color space, all fonts embedded, no transparency, PDF 1.3.
                PagePerfect converts XeLaTeX output to PDF/X-1a via Ghostscript post-processing with US Web Coated (SWOP) v2 output intent.
              </p>
              <p className="p text-sm">
                Select &quot;IngramSpark&quot; as your platform in the Press stage, then click &quot;Export PDF/X-1a&quot; to generate a compliant file.
                The standard interior PDF download remains available for KDP (which accepts regular PDFs).
              </p>
            </div>

            {/* Lulu Integration */}
            <div className="card p-6">
              <div className="flex items-baseline gap-3 mb-4">
                <h3 className="font-display text-lg font-bold text-text-primary">Lulu xPress API</h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">Requires API Keys</span>
              </div>
              <p className="p text-sm mb-4">
                Lulu is the only major print-on-demand platform with a full REST API. PagePerfect integrates with Lulu xPress
                for cost estimation, print job creation, and order status tracking via webhooks.
              </p>
              <div className="space-y-3 mt-4">
                <div className="bg-surface-subtle p-4 rounded-lg border border-[rgba(255,255,255,0.04)]">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary mb-2">Configuration</p>
                  <div className="space-y-1 text-sm text-text-secondary">
                    <p><code className="text-accent">LULU_CLIENT_KEY</code> — API key from developers.lulu.com</p>
                    <p><code className="text-accent">LULU_CLIENT_SECRET</code> — API secret</p>
                    <p><code className="text-accent">LULU_SANDBOX=true</code> — Use sandbox for testing (no real charges)</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="bg-surface-subtle p-4 rounded-lg border border-[rgba(255,255,255,0.04)]">
                    <code className="text-accent text-sm font-mono">POST /api/lulu/cost-estimate</code>
                    <p className="text-xs text-text-tertiary mt-1">Calculate print + shipping cost without ordering</p>
                  </div>
                  <div className="bg-surface-subtle p-4 rounded-lg border border-[rgba(255,255,255,0.04)]">
                    <code className="text-accent text-sm font-mono">POST /api/lulu/print-job</code>
                    <p className="text-xs text-text-tertiary mt-1">Create a print job (actual order)</p>
                  </div>
                  <div className="bg-surface-subtle p-4 rounded-lg border border-[rgba(255,255,255,0.04)]">
                    <code className="text-accent text-sm font-mono">GET /api/lulu/print-job/:id</code>
                    <p className="text-xs text-text-tertiary mt-1">Check print job status</p>
                  </div>
                  <div className="bg-surface-subtle p-4 rounded-lg border border-[rgba(255,255,255,0.04)]">
                    <code className="text-accent text-sm font-mono">GET /api/lulu/status</code>
                    <p className="text-xs text-text-tertiary mt-1">Check if Lulu API is configured</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Comparison */}
            <div className="card p-6">
              <h3 className="font-display text-lg font-bold text-text-primary mb-4">Platform Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary">Feature</th>
                      <th className="text-center py-2 px-4 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary">KDP</th>
                      <th className="text-center py-2 px-4 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary">IngramSpark</th>
                      <th className="text-center py-2 px-4 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary">Lulu</th>
                    </tr>
                  </thead>
                  <tbody className="text-text-secondary">
                    <tr className="border-b border-border-subtle"><td className="py-2 pr-4">PDF format</td><td className="py-2 px-4 text-center">Standard</td><td className="py-2 px-4 text-center">PDF/X-1a</td><td className="py-2 px-4 text-center">Standard</td></tr>
                    <tr className="border-b border-border-subtle"><td className="py-2 pr-4">API upload</td><td className="py-2 px-4 text-center text-text-tertiary">No</td><td className="py-2 px-4 text-center text-text-tertiary">FTP only</td><td className="py-2 px-4 text-center text-accent">REST API</td></tr>
                    <tr className="border-b border-border-subtle"><td className="py-2 pr-4">Cost API</td><td className="py-2 px-4 text-center text-text-tertiary">No</td><td className="py-2 px-4 text-center text-text-tertiary">No</td><td className="py-2 px-4 text-center text-accent">Yes</td></tr>
                    <tr className="border-b border-border-subtle"><td className="py-2 pr-4">Distribution</td><td className="py-2 px-4 text-center">Amazon</td><td className="py-2 px-4 text-center">40,000+ retailers</td><td className="py-2 px-4 text-center">Direct + retail</td></tr>
                    <tr className="border-b border-border-subtle"><td className="py-2 pr-4">Page range</td><td className="py-2 px-4 text-center">24–828</td><td className="py-2 px-4 text-center">18–1200</td><td className="py-2 px-4 text-center">2–800</td></tr>
                    <tr><td className="py-2 pr-4">Sandbox</td><td className="py-2 px-4 text-center text-text-tertiary">No</td><td className="py-2 px-4 text-center text-text-tertiary">No</td><td className="py-2 px-4 text-center text-accent">Yes</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════════════════
            TROUBLESHOOTING
            ══════════════════════════════════════════════════════ */}
        <Section className="pt-0">
          <div className="mb-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-text-tertiary mb-3">Troubleshooting</p>
            <h2 className="font-display text-h2 font-bold tracking-tight text-text-primary">Common Issues</h2>
          </div>

          <div className="grid gap-4">
            <div className="card p-6">
              <h3 className="font-display text-xl font-bold text-text-primary mb-3">Undefined citation</h3>
              <p className="p">
                If the error console shows <code className="text-accent text-sm">Undefined citations</code>, confirm the keys exist in
                <code className="text-accent text-sm"> references.bib</code> on the server and that your in-text cites use Pandoc syntax
                <code className="text-accent text-sm"> [@Key]</code> exactly.
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-xl font-bold text-text-primary mb-3">No PDF / 400-501 errors</h3>
              <ul className="list-disc pl-5 text-text-secondary leading-7">
                <li>Make sure the compiler backend is running on <code className="text-accent text-sm">http://localhost:4000</code>.</li>
                <li>If using Docker: <code className="text-accent text-sm">npm run docker:build && npm run docker:run</code> in <code className="text-accent text-sm">backend/</code>.</li>
                <li>Network errors: check that your browser can reach <code className="text-accent text-sm">/api/health</code>.</li>
              </ul>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-xl font-bold text-text-primary mb-3">Template or package issues</h3>
              <p className="p">
                If the console lists missing LaTeX packages, add them to the Dockerfile via
                <code className="text-accent text-sm"> tlmgr install &lt;package&gt;</code>, rebuild, and redeploy.
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-xl font-bold text-text-primary mb-3">Style warnings</h3>
              <p className="p">
                Double spaces after punctuation are flagged as warnings. They won&apos;t stop compilation but are worth fixing for polish.
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-xl font-bold text-text-primary mb-3">Recommended Reading</h3>
              <p className="p mb-4">
                PagePerfect&apos;s grid system is inspired by Josef Muller-Brockmann&apos;s systematic approach to graphic design — baseline grids, proportional typography, and mathematical spacing.
              </p>
              <div className="bg-surface-subtle p-4 rounded-lg border border-[rgba(255,255,255,0.04)]">
                <p className="text-sm font-medium text-text-primary mb-1">Grid Systems in Graphic Design</p>
                <p className="text-sm text-text-tertiary mb-3">Josef Muller-Brockmann</p>
                <a
                  href="https://ia902309.us.archive.org/4/items/GridSystemsInGraphicDesignJosefMullerBrockmann/Grid%20systems%20in%20graphic%20design%20-%20Josef%20Muller-Brockmann.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent hover:text-accent-hover text-sm font-medium transition-colors"
                >
                  Read the PDF
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </div>
          </div>
        </Section>
      </Container>
    </main>
  )
}
