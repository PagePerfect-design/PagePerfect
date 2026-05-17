import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Philosophy & Colophon — PagePerfect',
  description:
    'The grid system is an aid, not a guarantee. PagePerfect brings the mathematical precision of the International Typographic Style to the modern manuscript. Philosophy, principles, and system specifications.',
  openGraph: {
    title: 'Philosophy & Colophon — PagePerfect',
    description:
      'The grid system is an aid, not a guarantee. PagePerfect brings the mathematical precision of the International Typographic Style to the modern manuscript.',
    type: 'website',
    images: ['/og-image.png'],
  },
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50">
      {children}
    </p>
  )
}

export default function PhilosophyPage() {
  return (
    <main id="main">
      {/* ── The Anchor — Müller-Brockmann ── */}
      <section className="border-b-2 border-[#111111] py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <SectionLabel>Philosophy &amp; Colophon</SectionLabel>
          <blockquote className="max-w-4xl">
            <p
              className="font-display font-extrabold tracking-tighter text-[#111111]"
              style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 3rem)',
                lineHeight: 1.05,
              }}
            >
              &ldquo;The grid system is an aid, not a guarantee. It permits a
              number of possible uses and each designer can look for a solution
              appropriate to his personal style. But one must learn how to use
              the grid; it is an art that requires practice.&rdquo;
            </p>
            <footer className="mt-6 font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50">
              — Josef Müller-Brockmann, <em className="not-italic">Grid Systems in Graphic Design</em>, 1981
            </footer>
          </blockquote>
        </div>
      </section>

      {/* ── The Translation — Ogilvy Persuasion ── */}
      <section className="border-b border-[#e5e5e0] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="max-w-2xl">
            <SectionLabel>01 — Premise</SectionLabel>
            <h2
              className="font-display font-extrabold tracking-tighter text-[#111111]"
              style={{
                fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)',
                lineHeight: 0.95,
              }}
            >
              The End of the Word Processor
            </h2>
            <div className="mt-8 space-y-6 font-body text-lg leading-[1.8] text-[#333333]">
              <p>
                Most writing software treats the page as an endless, structureless
                void. You type, you hit the spacebar, you drag margins, and you
                hope the final exported document looks professional. It rarely does.
              </p>
              <p>
                PagePerfect was built to bring the rigorous, mathematical precision
                of the International Typographic Style to the modern manuscript.
              </p>
              <p>
                We do not offer you a blank canvas. We offer you an engine. When you
                paste your text into PagePerfect, it is immediately locked to a
                strict baseline grid. The margins are calculated using golden-ratio
                proportions. The hierarchy is absolute. The result is a document that
                communicates with total, undeniable authority.
              </p>
              <p className="font-display text-xl font-bold tracking-tight text-[#111111]">
                You supply the words. The engine supplies the architecture.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Principles ── */}
      <section className="border-b border-[#e5e5e0] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <SectionLabel>02 — Principles</SectionLabel>
          <h2
            className="font-display font-extrabold tracking-tighter text-[#111111]"
            style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)',
              lineHeight: 0.95,
            }}
          >
            What We Believe
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-0 md:grid-cols-2">
            {[
              {
                number: '01',
                title: 'The grid is non-negotiable',
                body: 'Every element on a PagePerfect page sits on a baseline grid. Text, headings, spacing, margins — all locked to a mathematical system derived from the baseline unit. No exceptions. No manual overrides.',
              },
              {
                number: '02',
                title: 'Typography dominates white space',
                body: 'No decorative imagery. No vague illustrations. If an image cannot be justified with empirical data or objective function, it is removed. The type breathes in the space that remains.',
              },
              {
                number: '03',
                title: 'Sharp geometry only',
                body: 'Rounded corners are friendly SaaS. We are a precision instrument. Every button, card, input, and container in the marketing context uses border-radius: 0. The only exception is the editor application.',
              },
              {
                number: '04',
                title: 'Contrast triggers action',
                body: 'The highest-contrast element on any page is the most valuable call to action. Red is reserved for the primary action. Secondary actions use black or outlined styles. Utility actions never receive the accent color.',
              },
              {
                number: '05',
                title: 'No dead labels',
                body: 'Every heading does work. "Documentation" becomes "Operating the Engine." "The Journal" becomes "Typography & Conversion." Headlines are benefits, commands, or active descriptions — never passive labels.',
              },
              {
                number: '06',
                title: 'The output is the proof',
                body: 'We do not promise professional results through marketing copy alone. The PDF that PagePerfect generates is the argument. Baseline conformance, golden-ratio margins, and print-ready output speak for themselves.',
              },
            ].map((principle) => (
              <div
                key={principle.number}
                className="border-b border-[#e5e5e0] py-8 md:odd:pr-10 md:even:pl-10 md:even:border-l md:even:border-[#e5e5e0]"
              >
                <span className="font-mono text-[0.625rem] text-[#111111]/30">
                  {principle.number}
                </span>
                <h3 className="mt-2 font-display text-lg font-bold tracking-tight text-[#111111]">
                  {principle.title}
                </h3>
                <p className="mt-3 font-body text-[0.9375rem] leading-[1.7] text-[#4a4a4a]">
                  {principle.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Colophon — Technical Ledger ── */}
      <section className="border-b-2 border-[#111111] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <SectionLabel>03 — System Specifications</SectionLabel>
          <h2
            className="font-display font-extrabold tracking-tighter text-[#111111]"
            style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)',
              lineHeight: 0.95,
            }}
          >
            Colophon
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-0 md:grid-cols-3">
            {/* Architecture */}
            <div className="border-b border-[#e5e5e0] py-6 md:border-b-0 md:border-r md:border-[#e5e5e0] md:pr-10">
              <p className="mb-4 font-mono text-[0.5625rem] uppercase tracking-[0.15em] text-[#111111]/50">
                Architecture
              </p>
              <div className="space-y-3">
                <ColophonEntry label="Engine" value="Typst" />
                <ColophonEntry label="Grid" value="12-Column Modular" />
                <ColophonEntry label="Baseline" value="11pt / 12pt" />
                <ColophonEntry label="Scale" value="Golden Ratio (1.618)" />
                <ColophonEntry label="Frontend" value="React / Next.js 15" />
                <ColophonEntry label="Backend" value="Express / Node.js" />
              </div>
            </div>

            {/* Typography */}
            <div className="border-b border-[#e5e5e0] py-6 md:border-b-0 md:border-r md:border-[#e5e5e0] md:px-10">
              <p className="mb-4 font-mono text-[0.5625rem] uppercase tracking-[0.15em] text-[#111111]/50">
                Typography
              </p>
              <div className="space-y-3">
                <ColophonEntry label="Display" value="Inter Tight" />
                <ColophonEntry label="Body" value="Source Serif 4" />
                <ColophonEntry label="Monospace" value="IBM Plex Mono" />
                <ColophonEntry label="Templates" value="15 Designs" />
                <ColophonEntry label="Page Sizes" value="19 Formats" />
                <ColophonEntry label="Margin Presets" value="7 Levels" />
              </div>
            </div>

            {/* Processing */}
            <div className="py-6 md:pl-10">
              <p className="mb-4 font-mono text-[0.5625rem] uppercase tracking-[0.15em] text-[#111111]/50">
                Processing
              </p>
              <div className="space-y-3">
                <ColophonEntry label="Output" value="PDF / PDF/X-1a" />
                <ColophonEntry label="Citations" value="BibTeX + CSL" />
                <ColophonEntry label="Conversion" value="DOCX → Markdown" />
                <ColophonEntry label="Print QA" value="Ink, DPI, Contrast" />
                <ColophonEntry label="Platforms" value="KDP, IngramSpark, Lulu" />
                <ColophonEntry label="Type" value="Print-Ready" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 text-center md:px-8">
          <p className="mb-4 font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50">
            Put the engine to work
          </p>
          <h2
            className="font-display font-extrabold tracking-tighter text-[#111111]"
            style={{ lineHeight: 0.95, fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)' }}
          >
            Start Formatting
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-body text-base text-[#4a4a4a]">
            Every principle on this page is built into PagePerfect — baseline
            grids, golden-ratio scales, and 15 templates engineered for
            readability and authority.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/app"
              className="border border-[#FF3333] bg-[#FF3333] px-8 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white transition-all duration-200 ease-pp hover:bg-[#E52222]"
            >
              Start Formatting
            </Link>
            <Link
              href="/docs"
              className="border border-[#111111]/20 px-8 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111]/50 transition-all duration-200 ease-pp hover:border-[#111111] hover:text-[#111111]"
            >
              Read Docs
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

function ColophonEntry({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="font-mono text-[0.6875rem] uppercase tracking-[0.05em] text-[#4a4a4a]">
        {label}
      </span>
      <span className="font-display text-[0.8125rem] font-semibold text-[#111111]">
        {value}
      </span>
    </div>
  )
}
