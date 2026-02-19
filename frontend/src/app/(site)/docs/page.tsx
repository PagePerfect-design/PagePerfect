import CopyCitation from '@/components/CopyCitation'
import AuthorGuideTools from '@/components/AuthorGuideTools'
import RequirementsCheck from './RequirementsCheck'
import DocsNav from './DocsNav'

export const metadata = {
  title: 'Documentation — PagePerfect',
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
  { size: '5 \u00d7 8\u2033', code: 'amazonFiveByEight', bestFor: 'Novellas, poetry, compact fiction' },
  { size: '5.5 \u00d7 8.5\u2033', code: 'fiveFiveByEightFive', bestFor: 'Standard fiction, memoir' },
  { size: '6 \u00d7 9\u2033', code: 'amazonSixByNine', bestFor: 'Nonfiction, trade standard' },
  { size: '7 \u00d7 10\u2033', code: 'amazonSevenByTen', bestFor: 'Textbooks, technical books' },
  { size: '8.5 \u00d7 11\u2033', code: 'amazonEightFiveByEleven', bestFor: 'Workbooks, cookbooks, manuals' },
]

const GUTTER_TABLE = [
  { pages: '24\u2013150', gutter: '0.375\u2033' },
  { pages: '151\u2013300', gutter: '0.500\u2033' },
  { pages: '301\u2013500', gutter: '0.625\u2033' },
  { pages: '501\u2013828', gutter: '0.750\u2033' },
]

const PLATFORM_TABLE = [
  { feature: 'PDF format', kdp: 'Standard', ingram: 'PDF/X-1a', lulu: 'Standard', luluAccent: false },
  { feature: 'API upload', kdp: 'No', ingram: 'FTP only', lulu: 'REST API', luluAccent: true },
  { feature: 'Cost API', kdp: 'No', ingram: 'No', lulu: 'Yes', luluAccent: true },
  { feature: 'Distribution', kdp: 'Amazon', ingram: '40,000+ retailers', lulu: 'Direct + retail', luluAccent: false },
  { feature: 'Page range', kdp: '24\u2013828', ingram: '18\u20131,200', lulu: '2\u2013800', luluAccent: false },
  { feature: 'Sandbox', kdp: 'No', ingram: 'No', lulu: 'Yes', luluAccent: true },
]

/* ─── Helper components ─── */

function SectionLabel({ children, number }: { children: React.ReactNode; number: string }) {
  return (
    <div className="docs-section-label">
      <span className="mr-3">{number}</span>
      {children}
    </div>
  )
}

function Admonition({ type, label, children }: { type: 'info' | 'warn' | 'tip'; label: string; children: React.ReactNode }) {
  const cls = type === 'info' ? 'docs-admonition-info' : type === 'warn' ? 'docs-admonition-warn' : 'docs-admonition-tip'
  return (
    <div className={`docs-admonition ${cls}`}>
      <div className="docs-admonition-label">{label}</div>
      <div className="font-body text-sm leading-relaxed text-[#3a3a3a]">{children}</div>
    </div>
  )
}

function ApiEndpoint({ method, path, note }: { method: string; path: string; note: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="docs-badge docs-badge-api shrink-0 mt-0.5">{method}</span>
      <div>
        <code className="text-sm">{path}</code>
        <p className="font-body text-xs text-[#999] mt-0.5">{note}</p>
      </div>
    </div>
  )
}

/* ─── Page ─── */

export default function DocsPage() {
  return (
    <div data-docs className="min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr]">
        {/* ── Sidebar ── */}
        <aside className="hidden lg:block">
          <DocsNav />
        </aside>

        {/* ── Main content ── */}
        <main id="main" className="min-w-0 px-8 py-12 md:px-16 lg:px-20 xl:px-24" style={{ maxWidth: '52rem' }}>

          {/* ══════════════════════════════════════════════════════════
              01 — QUICK START
              ══════════════════════════════════════════════════════════ */}
          <section id="quickstart" className="scroll-mt-16 mb-20">
            <SectionLabel number="01">Getting Started</SectionLabel>
            <h1 className="docs-section-title" style={{ fontSize: '2.25rem', borderBottomWidth: '2px' }}>
              Documentation
            </h1>

            <p className="font-body text-lg leading-8 text-[#3a3a3a] mb-8 max-w-xl">
              Quick tips to get your manuscript compiling smoothly. Use the helpers below to copy a valid
              citation and test that your bibliography is set up.
            </p>

            <div className="space-y-4">
              <CopyCitation />
              <AuthorGuideTools />
            </div>
          </section>

          {/* ── Requirements Check ── */}
          <section id="requirements" className="scroll-mt-16 mb-20">
            <SectionLabel number="01.1">Diagnostics</SectionLabel>
            <h2 className="docs-section-title" style={{ fontSize: '1.375rem' }}>Requirements Check</h2>
            <RequirementsCheck />
          </section>

          {/* ══════════════════════════════════════════════════════════
              02 — EDITOR GUIDE
              ══════════════════════════════════════════════════════════ */}
          <section id="editor" className="scroll-mt-16 mb-10">
            <SectionLabel number="02">Editor</SectionLabel>
            <h2 className="docs-section-title">Editor Guide</h2>
            <p className="font-body text-base leading-7 text-[#3a3a3a] mb-8 max-w-xl">
              The editor is a three-stage pipeline: Portal (ingest), Design (typeset), and Launch (export).
              All settings auto-save to local storage.
            </p>
          </section>

          {/* Keyboard Shortcuts */}
          <section id="shortcuts" className="scroll-mt-16 mb-10">
            <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a] mb-4">Keyboard Shortcuts</h3>
            <p className="font-body text-sm leading-7 text-[#3a3a3a] mb-4">
              Available in the Design stage. Press <code>?</code> in the editor to toggle the shortcut legend.
            </p>
            <table className="docs-table" style={{ maxWidth: '28rem' }}>
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['\u2190 / \u2192', 'Cycle through templates'],
                  ['Space', 'Force recompile'],
                  ['E', 'Toggle manuscript editor'],
                  ['S', 'Toggle publishing systems panel'],
                  ['P', 'Open export / publish overlay'],
                  ['?', 'Toggle shortcuts legend'],
                  ['Esc', 'Close active panel'],
                ].map(([key, desc]) => (
                  <tr key={key}>
                    <td className="font-mono text-[13px] font-medium text-[#1a1a1a]">{key}</td>
                    <td>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Compile Modes */}
          <section id="compile-modes" className="scroll-mt-16 mb-10">
            <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a] mb-4">Compile Modes</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="docs-template-card">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#999] mb-1">Preview (Fast)</p>
                <p className="font-body text-sm text-[#3a3a3a] leading-relaxed">
                  Skips <code>microtype</code> and <code>csquotes</code> packages. Faster compilation for iterative editing.
                  Use this while drafting.
                </p>
              </div>
              <div className="docs-template-card">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#999] mb-1">Full Quality</p>
                <p className="font-body text-sm text-[#3a3a3a] leading-relaxed">
                  Enables <code>microtype</code> (optical margin alignment, character protrusion) and <code>csquotes</code> (context-sensitive quotation marks).
                  Use for final output.
                </p>
              </div>
            </div>
          </section>

          {/* Safe Mode */}
          <section id="safe-mode" className="scroll-mt-16 mb-10">
            <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a] mb-4">Safe Mode</h3>
            <p className="font-body text-sm leading-7 text-[#3a3a3a] mb-3">
              When enabled, all Pandoc citation syntax (<code>[@Key]</code>) is stripped and replaced with placeholder text.
              Compilation proceeds without needing a valid <code>references.bib</code>.
            </p>
            <Admonition type="tip" label="When to Use">
              Enable safe mode while writing or when your bibliography has missing keys. Disable it for final
              output to render proper citations and bibliography.
            </Admonition>
          </section>

          {/* Manuscript Input */}
          <section id="input" className="scroll-mt-16 mb-10">
            <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a] mb-4">Manuscript Input</h3>
            <p className="font-body text-sm leading-7 text-[#3a3a3a] mb-4">
              Three input methods in the Portal stage: drag-and-drop a file, browse files, or paste text directly.
            </p>
            <table className="docs-table" style={{ maxWidth: '32rem' }}>
              <thead>
                <tr>
                  <th>Format</th>
                  <th>Handling</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-mono text-[13px] font-medium text-[#1a1a1a]">.md / .txt</td>
                  <td>Read directly as Markdown. From-Word cleaning applied automatically.</td>
                </tr>
                <tr>
                  <td className="font-mono text-[13px] font-medium text-[#1a1a1a]">.docx</td>
                  <td>Sent to backend for Pandoc conversion to Markdown, then cleaned.</td>
                </tr>
                <tr>
                  <td className="font-mono text-[13px] font-medium text-[#1a1a1a]">Paste</td>
                  <td>Click &quot;Paste text&quot; to open the text area. From-Word cleaning applied.</td>
                </tr>
              </tbody>
            </table>

            <Admonition type="info" label="From-Word Cleaning">
              Pasted or dropped text is automatically normalized: smart quotes {'\u2192'} straight quotes, em/en dashes {'\u2192'} spaced em dashes,
              non-breaking spaces {'\u2192'} regular spaces, bullet characters {'\u2192'} Markdown list items, excess newlines collapsed,
              trailing whitespace stripped.
            </Admonition>
          </section>

          {/* Genre Detection */}
          <section id="genre-detection" className="scroll-mt-16 mb-10">
            <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a] mb-4">Genre Auto-Detection</h3>
            <p className="font-body text-sm leading-7 text-[#3a3a3a] mb-4">
              The Portal stage scans the first 150 lines of your manuscript for structural signals and recommends a template.
              You can always override the suggestion in the Style menu.
            </p>
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Signal</th>
                  <th>Template</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['INT. / EXT. / FADE IN / CUT TO', 'Cinema', 'High'],
                  ['Ingredients, measurements (tsp, cups, oz)', 'Heirloom', 'High'],
                  ['4+ code blocks or WARNING/CAUTION/NOTE headers', 'Operator', 'Medium'],
                  ['Abstract, bibliography, [@citations]', 'Chicago', 'Medium'],
                  ['Executive summary, KPIs, quarterly, fiscal', 'Matrix', 'Medium'],
                  ['2+ chapter headings or 5+ dialogue lines', 'Paperback', 'Low'],
                ].map(([signal, tmpl, conf]) => (
                  <tr key={signal}>
                    <td className="text-[13px]">{signal}</td>
                    <td className="accent">{tmpl}</td>
                    <td className={conf === 'Low' ? 'muted' : ''}>{conf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* URL Parameters */}
          <section id="url-params" className="scroll-mt-16 mb-20">
            <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a] mb-4">URL Parameters</h3>
            <p className="font-body text-sm leading-7 text-[#3a3a3a] mb-2">
              Pre-select a template by appending <code>?template=name</code> to the editor URL.
            </p>
            <div className="docs-admonition docs-admonition-tip">
              <div className="docs-admonition-label">Example</div>
              <code className="text-sm">/app?template=cinema</code>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              03 — PAGE SIZES & MARGINS
              ══════════════════════════════════════════════════════════ */}
          <section id="page-sizes" className="scroll-mt-16 mb-10">
            <SectionLabel number="03">Layout</SectionLabel>
            <h2 className="docs-section-title">Page Sizes &amp; Margins</h2>
          </section>

          {/* All Page Sizes */}
          <section id="all-sizes" className="scroll-mt-16 mb-10">
            <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a] mb-4">All Page Sizes</h3>
            <p className="font-body text-sm leading-7 text-[#3a3a3a] mb-4">
              13 page sizes available. Standard sizes are shown by default; KDP sizes are under a collapsible menu in the editor.
            </p>
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Code</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['5.5 \u00d7 8.5\u2033', 'fiveFiveByEightFive', 'Digest'],
                  ['6 \u00d7 9\u2033', 'sixByNine', 'Trade'],
                  ['8.5 \u00d7 11\u2033', 'letter', 'Letter'],
                  ['210 \u00d7 297 mm', 'a4', 'A4'],
                  ['148 \u00d7 210 mm', 'a5', 'A5'],
                  ['7 \u00d7 10\u2033', 'sevenByTen', 'Textbook'],
                  ['156 \u00d7 234 mm', 'royal', 'Royal'],
                  ['129 \u00d7 198 mm', 'bFormat', 'B-format'],
                  ['5 \u00d7 8\u2033', 'amazonFiveByEight', 'KDP'],
                  ['6 \u00d7 9\u2033', 'amazonSixByNine', 'KDP'],
                  ['7 \u00d7 10\u2033', 'amazonSevenByTen', 'KDP'],
                  ['8 \u00d7 10\u2033', 'amazonEightByTen', 'KDP'],
                  ['8.5 \u00d7 11\u2033', 'amazonEightFiveByEleven', 'KDP'],
                ].map(([size, code, type]) => (
                  <tr key={code}>
                    <td className="font-mono text-[13px] font-medium text-[#1a1a1a]">{size}</td>
                    <td className="accent">{code}</td>
                    <td className={type === 'KDP' ? '' : 'muted'}>{type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Margin Presets */}
          <section id="margins" className="scroll-mt-16 mb-20">
            <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a] mb-4">Margin Presets</h3>
            <p className="font-body text-sm leading-7 text-[#3a3a3a] mb-4">
              Seven presets from minimal to generous. Margins are calculated as grid-unit multiples of the template&apos;s baseline.
            </p>
            <table className="docs-table" style={{ maxWidth: '28rem' }}>
              <thead>
                <tr>
                  <th>Preset</th>
                  <th>Grid Units</th>
                  <th>Character</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Minimal', '2', 'Tight'],
                  ['Compact', '3', 'Snug'],
                  ['Narrow', '4', 'Slim'],
                  ['Normal', '5', 'Standard'],
                  ['Wide', '6', 'Open'],
                  ['Academic', '7', 'Scholarly'],
                  ['Generous', '8', 'Airy'],
                ].map(([preset, units, desc]) => (
                  <tr key={preset}>
                    <td className="font-medium text-[#1a1a1a]">{preset}</td>
                    <td className="accent">{units}</td>
                    <td className="muted">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Admonition type="info" label="How Margins Are Calculated">
              The grid system multiplies the template&apos;s baseline (11pt or 12pt) by the preset&apos;s unit count,
              then converts to page-size-appropriate units. For example: Normal (5) on a 12pt baseline =
              60pt = 0.833&quot; margins.
            </Admonition>
          </section>

          {/* ══════════════════════════════════════════════════════════
              04 — TWELVE TYPOGRAPHIC SYSTEMS
              ══════════════════════════════════════════════════════════ */}
          <section id="templates" className="scroll-mt-16 mb-10">
            <SectionLabel number="04">Reference</SectionLabel>
            <h2 className="docs-section-title">Twelve Typographic Systems</h2>
            <p className="font-body text-base leading-7 text-[#3a3a3a] mb-8 max-w-xl">
              Every template is a complete typographic system — not a theme. Each implements specific design
              principles: baseline grids, proportional scales, calculated margins, and intentional font stacks.
            </p>
          </section>

          {TEMPLATE_DOCS.map((t, i) => (
            <section key={t.key} id={`template-${t.key}`} className="scroll-mt-16 mb-10">
              <div className="docs-template-card">
                {/* Header row */}
                <div className="flex items-baseline justify-between mb-1">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[10px] text-[#999]">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="font-display text-lg font-bold tracking-tight text-[#1a1a1a]">{t.name}</h3>
                  </div>
                  <span className="docs-badge">{t.category}</span>
                </div>
                <p className="font-mono text-[11px] text-[#999] mb-4">{t.subtitle}</p>

                {/* Description */}
                <p className="font-body text-sm leading-7 text-[#3a3a3a] mb-6">{t.description}</p>

                {/* Spec grid */}
                <div className="grid gap-6 md:grid-cols-3 mb-6">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#999] mb-2">Font Stack</p>
                    <p className="font-display text-sm font-medium text-[#1a1a1a]">{t.fonts.primary}</p>
                    {t.fonts.secondary && <p className="font-display text-sm text-[#6a6a64]">+ {t.fonts.secondary}</p>}
                    {t.fonts.mono && <p className="font-mono text-xs text-[#6a6a64]">{t.fonts.mono}</p>}
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#999] mb-2">Geometry</p>
                    <div className="space-y-0.5 font-display text-sm text-[#3a3a3a]">
                      <p>Base: {t.geometry.baseSize}</p>
                      <p>Leading: {t.geometry.leading}</p>
                      <p>Indent: {t.geometry.indent}</p>
                      <p>Par skip: {t.geometry.parskip}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#999] mb-2">Best For</p>
                    <p className="font-body text-sm text-[#3a3a3a]">{t.bestFor}</p>
                  </div>
                </div>

                {/* Features — hairline top */}
                <div className="border-t border-[#e5e5e0] pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#999] mb-3">Key Features</p>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {t.features.map((f, fi) => (
                      <p key={fi} className="flex items-start gap-2 font-display text-[13px] text-[#3a3a3a]">
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-[#0033ff] shrink-0" />
                        {f}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ))}

          {/* ══════════════════════════════════════════════════════════
              03 — AMAZON KDP GUIDE
              ══════════════════════════════════════════════════════════ */}
          <section id="kdp" className="scroll-mt-16 mb-10 mt-20">
            <SectionLabel number="05">Publishing</SectionLabel>
            <h2 className="docs-section-title">Amazon KDP Guide</h2>
            <p className="font-body text-base leading-7 text-[#3a3a3a] mb-8 max-w-xl">
              PagePerfect supports all five Amazon KDP trim sizes with dynamic gutter calculation and spine width estimation.
              Select any KDP page size in the editor to generate compliant interior PDFs.
            </p>
          </section>

          {/* Trim Sizes — Swiss table */}
          <section id="trim-sizes" className="scroll-mt-16 mb-10">
            <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a] mb-4">KDP Trim Sizes</h3>
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Trim</th>
                  <th>Code</th>
                  <th>Best For</th>
                </tr>
              </thead>
              <tbody>
                {KDP_TRIM_SIZES.map((s) => (
                  <tr key={s.code}>
                    <td className="font-mono text-[13px] font-medium text-[#1a1a1a]">{s.size}</td>
                    <td className="accent">{s.code}</td>
                    <td>{s.bestFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Dynamic Gutter — Swiss table */}
          <section id="gutters" className="scroll-mt-16 mb-10">
            <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a] mb-4">Dynamic Gutter (Inside Margin)</h3>
            <p className="font-body text-sm leading-7 text-[#3a3a3a] mb-4">
              KDP requires minimum inside margins based on page count to accommodate binding.
            </p>
            <table className="docs-table" style={{ maxWidth: '24rem' }}>
              <thead>
                <tr>
                  <th>Page Count</th>
                  <th>Min. Gutter</th>
                </tr>
              </thead>
              <tbody>
                {GUTTER_TABLE.map((g) => (
                  <tr key={g.pages}>
                    <td>{g.pages}</td>
                    <td className="accent">{g.gutter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Spine Width */}
          <section id="spine" className="scroll-mt-16 mb-20">
            <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a] mb-4">Spine Width Calculation</h3>
            <p className="font-body text-sm leading-7 text-[#3a3a3a] mb-4">
              Spine width determines your cover template dimensions. Calculated automatically in the Press stage based on word count.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="docs-template-card">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#999] mb-1">White Paper (55#)</p>
                <p className="font-display text-sm font-medium text-[#1a1a1a]">Page count &times; 0.002252&quot;</p>
                <p className="font-mono text-xs text-[#999] mt-1">300 pages = 0.676&quot; spine</p>
              </div>
              <div className="docs-template-card">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#999] mb-1">Cream Paper (60#)</p>
                <p className="font-display text-sm font-medium text-[#1a1a1a]">Page count &times; 0.0025&quot;</p>
                <p className="font-mono text-xs text-[#999] mt-1">300 pages = 0.750&quot; spine</p>
              </div>
            </div>

            <Admonition type="info" label="API Endpoints">
              <ApiEndpoint method="GET" path="/api/kdp/spine?pages=300" note="Returns spine width for both paper stocks and recommended gutter" />
              <ApiEndpoint method="GET" path="/api/kdp/gutter?pages=300" note="Returns minimum inside margin for the given page count" />
            </Admonition>
          </section>

          {/* ══════════════════════════════════════════════════════════
              04 — PUBLISHING AUTOMATION
              ══════════════════════════════════════════════════════════ */}
          <section id="automation" className="scroll-mt-16 mb-10">
            <SectionLabel number="06">Automation</SectionLabel>
            <h2 className="docs-section-title">Publishing Automation</h2>
            <p className="font-body text-base leading-7 text-[#3a3a3a] mb-8 max-w-xl">
              PagePerfect automates the entire path from Markdown to printed book. Pre-flight validation
              catches rejection-causing errors before submission, while platform-specific exports ensure compliance.
            </p>
          </section>

          {/* Pre-flight Validator */}
          <section id="preflight" className="scroll-mt-16 mb-10">
            <div className="flex items-baseline gap-3 mb-3">
              <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a]">Pre-flight Validator</h3>
              <span className="docs-badge docs-badge-live">Live</span>
            </div>
            <p className="font-body text-sm leading-7 text-[#3a3a3a] mb-4">
              The Press stage runs real-time pre-flight checks against your target platform&apos;s requirements.
              Select Amazon KDP, IngramSpark, or Lulu to validate margins, page count, gutter, trim size, and font embedding.
            </p>
            <Admonition type="tip" label="API">
              <ApiEndpoint method="POST" path="/api/preflight" note='Body: { pageSize, marginPreset, template, wordCount, platform: "kdp" | "ingram" | "lulu" }' />
            </Admonition>
          </section>

          {/* Cover Dimensions */}
          <section id="cover-dimensions" className="scroll-mt-16 mb-10">
            <div className="flex items-baseline gap-3 mb-3">
              <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a]">Cover Dimensions Calculator</h3>
              <span className="docs-badge docs-badge-live">Live</span>
            </div>
            <p className="font-body text-sm leading-7 text-[#3a3a3a] mb-4">
              Calculates exact cover template dimensions including spine width, bleed zones, and safety margins.
              Displayed automatically in the Press stage based on page count and paper stock.
            </p>
            <Admonition type="tip" label="API">
              <ApiEndpoint method="GET" path="/api/cover-dimensions?width=6&amp;height=9&amp;pages=300&amp;paper=white" note="Returns full cover width/height, spine, bleed, safety margins, and breakdown" />
            </Admonition>
          </section>

          {/* PDF/X-1a */}
          <section id="pdfx" className="scroll-mt-16 mb-10">
            <div className="flex items-baseline gap-3 mb-3">
              <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a]">PDF/X-1a Export</h3>
              <span className="docs-badge docs-badge-api">IngramSpark</span>
            </div>
            <p className="font-body text-sm leading-7 text-[#3a3a3a] mb-2">
              IngramSpark requires PDF/X-1a:2001 compliance — CMYK color space, all fonts embedded, no transparency, PDF 1.3.
              PagePerfect converts XeLaTeX output to PDF/X-1a via Ghostscript post-processing with US Web Coated (SWOP) v2 output intent.
            </p>
            <Admonition type="info" label="Note">
              Select &quot;IngramSpark&quot; as your platform in the Press stage, then click &quot;Export PDF/X-1a&quot; to generate a compliant file.
              The standard interior PDF download remains available for KDP (which accepts regular PDFs).
            </Admonition>
          </section>

          {/* Lulu */}
          <section id="lulu" className="scroll-mt-16 mb-10">
            <div className="flex items-baseline gap-3 mb-3">
              <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a]">Lulu xPress API</h3>
              <span className="docs-badge docs-badge-warn">Requires API Keys</span>
            </div>
            <p className="font-body text-sm leading-7 text-[#3a3a3a] mb-4">
              Lulu is the only major print-on-demand platform with a full REST API. PagePerfect integrates with Lulu xPress
              for cost estimation, print job creation, and order status tracking via webhooks.
            </p>

            <Admonition type="warn" label="Configuration Required">
              <div className="space-y-1 font-mono text-xs">
                <p><code>LULU_CLIENT_KEY</code> — API key from developers.lulu.com</p>
                <p><code>LULU_CLIENT_SECRET</code> — API secret</p>
                <p><code>LULU_SANDBOX=true</code> — Use sandbox for testing (no real charges)</p>
              </div>
            </Admonition>

            <div className="mt-4 space-y-1">
              <ApiEndpoint method="POST" path="/api/lulu/cost-estimate" note="Calculate print + shipping cost without ordering" />
              <ApiEndpoint method="POST" path="/api/lulu/print-job" note="Create a print job (actual order)" />
              <ApiEndpoint method="GET" path="/api/lulu/print-job/:id" note="Check print job status" />
              <ApiEndpoint method="GET" path="/api/lulu/status" note="Check if Lulu API is configured" />
            </div>
          </section>

          {/* Platform Comparison — Swiss table */}
          <section id="platform-comparison" className="scroll-mt-16 mb-20">
            <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a] mb-4">Platform Comparison</h3>
            <div className="overflow-x-auto">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>KDP</th>
                    <th>IngramSpark</th>
                    <th>Lulu</th>
                  </tr>
                </thead>
                <tbody>
                  {PLATFORM_TABLE.map((row) => (
                    <tr key={row.feature}>
                      <td className="font-medium text-[#1a1a1a]">{row.feature}</td>
                      <td className={row.kdp === 'No' ? 'muted' : ''}>{row.kdp}</td>
                      <td className={row.ingram === 'No' || row.ingram === 'FTP only' ? 'muted' : ''}>{row.ingram}</td>
                      <td className={row.luluAccent ? 'accent' : ''}>{row.lulu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              05 — TROUBLESHOOTING
              ══════════════════════════════════════════════════════════ */}
          <section id="troubleshooting" className="scroll-mt-16 mb-20">
            <SectionLabel number="07">Support</SectionLabel>
            <h2 className="docs-section-title">Troubleshooting</h2>

            {/* Limits */}
            <div className="mb-8">
              <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a] mb-4">Limits</h3>
              <table className="docs-table" style={{ maxWidth: '32rem' }}>
                <thead>
                  <tr>
                    <th>Limit</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="font-medium text-[#1a1a1a]">Max Markdown size</td><td className="accent">2 MB</td></tr>
                  <tr><td className="font-medium text-[#1a1a1a]">Max .docx upload</td><td className="accent">10 MB</td></tr>
                  <tr><td className="font-medium text-[#1a1a1a]">Compile timeout</td><td className="accent">45 seconds</td></tr>
                  <tr><td className="font-medium text-[#1a1a1a]">Rate limit (compile)</td><td className="accent">20/min per IP</td></tr>
                  <tr><td className="font-medium text-[#1a1a1a]">Rate limit (general)</td><td className="accent">120/min per IP</td></tr>
                </tbody>
              </table>
            </div>

            {/* Error Reference */}
            <div className="mb-8">
              <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a] mb-4">Error Reference</h3>
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Error</th>
                    <th>Cause</th>
                    <th>Fix</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="accent">rate_limited</td>
                    <td>Too many compile requests</td>
                    <td>Wait 60 seconds, then retry</td>
                  </tr>
                  <tr>
                    <td className="accent">payload_too_large</td>
                    <td>Markdown exceeds 2 MB</td>
                    <td>Split manuscript or remove embedded data</td>
                  </tr>
                  <tr>
                    <td className="accent">compile_timeout</td>
                    <td>XeLaTeX exceeded 45s</td>
                    <td>Simplify content, reduce images, or use Preview mode</td>
                  </tr>
                  <tr>
                    <td className="accent">compile_failed</td>
                    <td>Pandoc/LaTeX error</td>
                    <td>Check error console for missing packages or syntax errors</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Undefined citation */}
            <div className="mb-6">
              <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a] mb-2">Undefined citation</h3>
              <Admonition type="warn" label="Common Error">
                If the error console shows <code>Undefined citations</code>, confirm the keys exist in{' '}
                <code>references.bib</code> on the server and that your in-text cites use Pandoc syntax{' '}
                <code>[@Key]</code> exactly.
              </Admonition>
            </div>

            {/* No PDF */}
            <div className="mb-6">
              <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a] mb-2">No PDF / 400{'\u2013'}501 errors</h3>
              <Admonition type="info" label="Checklist">
                <ul className="list-disc pl-4 space-y-1">
                  <li>Make sure the compiler backend is running on <code>http://localhost:4000</code>.</li>
                  <li>If using Docker: <code>npm run docker:build &amp;&amp; npm run docker:run</code> in <code>backend/</code>.</li>
                  <li>Network errors: check that your browser can reach <code>/api/health</code>.</li>
                </ul>
              </Admonition>
            </div>

            {/* Template or package issues */}
            <div className="mb-6">
              <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a] mb-2">Template or package issues</h3>
              <Admonition type="info" label="Fix">
                If the console lists missing LaTeX packages, add them to the Dockerfile via{' '}
                <code>tlmgr install &lt;package&gt;</code>, rebuild, and redeploy.
              </Admonition>
            </div>


            {/* Style warnings */}
            <div className="mb-6">
              <h3 className="font-display text-base font-bold tracking-tight text-[#1a1a1a] mb-2">Style warnings</h3>
              <Admonition type="tip" label="Tip">
                Double spaces after punctuation are flagged as warnings. They won&apos;t stop compilation but are worth fixing for polish.
              </Admonition>
            </div>

            {/* Recommended Reading */}
            <div className="mt-12 border-t-2 border-[#1a1a1a] pt-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#999] mb-4">Recommended Reading</p>
              <div className="docs-template-card">
                <p className="font-display text-sm font-bold text-[#1a1a1a] mb-0.5">Grid Systems in Graphic Design</p>
                <p className="font-body text-sm text-[#6a6a64] mb-3">Josef Muller-Brockmann</p>
                <a
                  href="https://ia902309.us.archive.org/4/items/GridSystemsInGraphicDesignJosefMullerBrockmann/Grid%20systems%20in%20graphic%20design%20-%20Josef%20Muller-Brockmann.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#0033ff] hover:text-[#2255ff] transition-colors"
                >
                  Read the PDF
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </div>

            {/* Colophon */}
            <div className="mt-16 border-t border-[#e5e5e0] pt-6">
              <p className="font-mono text-[10px] text-[#c0c0c0]">
                PagePerfect Documentation &middot; Built on XeLaTeX + Pandoc &middot; Typography is the foundation of graphic design.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
