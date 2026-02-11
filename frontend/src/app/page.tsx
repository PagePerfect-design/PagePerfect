import Button from '@/components/Button'
import Link from 'next/link'

const TEMPLATES = [
  { key: 'symphony', name: 'Symphony', desc: 'Classic academic with harmonious typography', tag: 'Academic' },
  { key: 'chronicle', name: 'Chronicle', desc: 'Editorial grid with multi-column layout', tag: 'Editorial' },
  { key: 'exhibit', name: 'Exhibit', desc: 'Modern trade with generous white space', tag: 'Trade' },
  { key: 'matrix', name: 'Matrix', desc: 'Structured corporate with systematic grids', tag: 'Business' },
  { key: 'avantgarde', name: 'Avant-Garde', desc: 'Experimental creative with bold choices', tag: 'Creative' },
  { key: 'paperback', name: 'Paperback', desc: 'Contemporary trade book design', tag: 'Fiction' },
]

const FEATURES = [
  {
    title: 'Baseline Grid System',
    desc: 'Every line of text sits on a mathematical grid. Headings, body, and margins follow Muller-Brockmann\'s systematic principles for vertical rhythm.',
  },
  {
    title: 'Golden-Ratio Typography',
    desc: 'Heading sizes derived from a 1.618 multiplier. Not arbitrary — calculated. The same scale used by the finest Swiss typographers.',
  },
  {
    title: 'Knuth-Plass Line Breaking',
    desc: 'XeLaTeX uses the same paragraph optimization algorithm as TeX — finding the mathematically optimal line breaks across entire paragraphs, not line-by-line.',
  },
  {
    title: 'Microtypography',
    desc: 'Optical margin alignment, character protrusion, and font expansion. The subtle refinements that separate professional typesetting from "good enough."',
  },
  {
    title: 'Print-Ready Output',
    desc: 'PDF output compatible with Amazon KDP, IngramSpark, and any print-on-demand service. 11 page sizes from pocket to full letter.',
  },
  {
    title: 'Markdown Native',
    desc: 'No .docx import corruption. No formatting loss. Write in clean Markdown, get professional output. Version control your manuscript with Git.',
  },
]

const COMPARISONS = [
  { tool: 'Vellum', price: '$500', platform: 'Mac only', fonts: '26 curated', typography: 'Good', customize: 'Limited' },
  { tool: 'Atticus', price: '$147', platform: 'Browser', fonts: '15 body', typography: 'Fair', customize: 'Moderate' },
  { tool: 'Reedsy', price: 'Free', platform: 'Browser', fonts: '3 themes', typography: 'Basic', customize: 'Minimal' },
  { tool: 'PagePerfect', price: 'Free tier', platform: 'Browser', fonts: 'LaTeX fonts', typography: 'Professional', customize: 'Full control' },
]

export default function Home() {
  return (
    <main id="main">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-[radial-gradient(ellipse,rgba(79,143,255,0.08)_0%,transparent_70%)]" />
        </div>
        <div className="mx-auto max-w-4xl px-6 md:px-8 text-center relative">
          <p className="font-mono text-sm tracking-widest text-accent uppercase mb-6 animate-fade-in">Professional typesetting in your browser</p>
          <h1 className="font-display text-hero font-black leading-[1.05] tracking-tight text-text-primary animate-fade-in-up">
            Your words deserve<br />
            <span className="gradient-accent-text">better typography</span>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed animate-fade-in-up">
            Paste your Markdown. Choose a template. Get a print-ready PDF with baseline grids,
            golden-ratio headings, and the same line-breaking algorithm used by TeX.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up">
            <Button size="lg" href="/app">Start Typesetting — Free</Button>
            <Button variant="secondary" size="lg" href="/pricing">View Pricing</Button>
          </div>
          <p className="mt-4 text-xs text-text-ghost animate-fade-in">No account required. No install. Works in any browser.</p>
        </div>
      </section>

      <div className="divider" />

      {/* How it works */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6 md:px-8">
          <h2 className="font-display text-h2 font-bold tracking-tight text-center text-text-primary mb-16">
            Three steps to a professionally typeset book
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Paste your text', desc: 'Drop in Markdown or paste from Word. Auto-clean strips smart quotes, normalizes dashes, and fixes formatting artifacts.' },
              { step: '02', title: 'Choose a template', desc: '8 design templates built on Muller-Brockmann grid principles. Academic, trade, editorial, creative — each with proper baseline grids.' },
              { step: '03', title: 'Export your PDF', desc: 'Print-ready output in seconds. Compatible with Amazon KDP, IngramSpark, and every print-on-demand service.' },
            ].map(item => (
              <div key={item.step} className="group">
                <div className="text-5xl font-display font-black text-accent/20 mb-4 group-hover:text-accent/40 transition-colors">{item.step}</div>
                <h3 className="font-display text-xl font-bold text-text-primary mb-2">{item.title}</h3>
                <p className="text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Why this is different — the typography advantage */}
      <section className="py-20 md:py-28 bg-surface-raised">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="text-center mb-16">
            <p className="font-mono text-sm tracking-widest text-accent uppercase mb-4">The typographic advantage</p>
            <h2 className="font-display text-h2 font-bold tracking-tight text-text-primary">
              What Vellum and Atticus can&apos;t do
            </h2>
            <p className="mt-4 text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Consumer formatting tools produce &ldquo;good enough&rdquo; output. PagePerfect uses the same
              XeLaTeX engine trusted by academic publishers, powered by a grid system designed by
              Josef Muller-Brockmann.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="card p-6 transition-all duration-200 hover:border-[rgba(255,255,255,0.1)] hover:shadow-card-hover hover:-translate-y-0.5">
                <h3 className="font-display text-lg font-bold text-text-primary mb-2">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Template showcase */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="text-center mb-16">
            <p className="font-mono text-sm tracking-widest text-accent uppercase mb-4">8 Design Templates</p>
            <h2 className="font-display text-h2 font-bold tracking-tight text-text-primary">
              Every template is a grid system
            </h2>
            <p className="mt-4 text-text-secondary max-w-2xl mx-auto">
              Not decorative skins. Each template implements a complete typographic system with
              calculated baselines, margins, and heading scales.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map(t => (
              <Link
                key={t.key}
                href={`/app?template=${t.key}`}
                className="card p-5 transition-all duration-200 hover:border-accent/20 hover:shadow-glow-accent hover:-translate-y-0.5 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-bold text-text-primary group-hover:text-accent transition-colors">{t.name}</h3>
                  <span className="font-mono text-xs text-text-ghost bg-surface-subtle px-2 py-0.5 rounded">{t.tag}</span>
                </div>
                <p className="text-sm text-text-secondary">{t.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Competitive comparison */}
      <section className="py-20 md:py-28 bg-surface-raised">
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-h2 font-bold tracking-tight text-text-primary">
              How we compare
            </h2>
            <p className="mt-4 text-text-secondary">Honest comparison. No spin.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.08)]">
                  <th className="text-left py-3 px-4 font-mono text-text-tertiary font-normal">Tool</th>
                  <th className="text-left py-3 px-4 font-mono text-text-tertiary font-normal">Price</th>
                  <th className="text-left py-3 px-4 font-mono text-text-tertiary font-normal">Platform</th>
                  <th className="text-left py-3 px-4 font-mono text-text-tertiary font-normal">Typography</th>
                  <th className="text-left py-3 px-4 font-mono text-text-tertiary font-normal">Customization</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISONS.map(c => (
                  <tr key={c.tool} className={`border-b border-[rgba(255,255,255,0.04)] ${c.tool === 'PagePerfect' ? 'bg-accent/5' : ''}`}>
                    <td className={`py-3 px-4 font-medium ${c.tool === 'PagePerfect' ? 'text-accent' : 'text-text-primary'}`}>{c.tool}</td>
                    <td className="py-3 px-4 text-text-secondary">{c.price}</td>
                    <td className="py-3 px-4 text-text-secondary">{c.platform}</td>
                    <td className="py-3 px-4 text-text-secondary">{c.typography}</td>
                    <td className="py-3 px-4 text-text-secondary">{c.customize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Final CTA */}
      <section className="py-24 md:py-32 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[60%] h-[50%] bg-[radial-gradient(ellipse,rgba(79,143,255,0.06)_0%,transparent_70%)]" />
        </div>
        <div className="mx-auto max-w-3xl px-6 md:px-8 relative">
          <h2 className="font-display text-h1 font-bold tracking-tight text-text-primary">
            Start typesetting now
          </h2>
          <p className="mt-4 text-lg text-text-secondary max-w-xl mx-auto">
            Free forever for basic use. No account needed. Open the editor and paste your manuscript.
          </p>
          <div className="mt-8">
            <Button size="lg" href="/app">Open the Editor</Button>
          </div>
        </div>
      </section>
    </main>
  )
}