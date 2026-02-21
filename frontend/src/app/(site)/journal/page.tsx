import type { Metadata } from 'next'
import Link from 'next/link'
import { ARTICLES } from './articles'

export const metadata: Metadata = {
  title: 'Typography & Conversion — PagePerfect Journal',
  description:
    'Essays on typography, layout, and visual communication. Where Swiss precision meets conversion-driven design — grounded in Müller-Brockmann, Ogilvy, and empirical reader research.',
  openGraph: {
    title: 'Typography & Conversion — PagePerfect Journal',
    description:
      'Essays on typography, layout, and visual communication. Where Swiss precision meets conversion-driven design.',
    type: 'website',
  },
}

const CATEGORIES = ['All', 'Typography', 'Layout', 'Conversion', 'Design Systems', 'Visual Communication'] as const

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50 mb-3">
      {children}
    </p>
  )
}

export default function JournalPage() {
  // Group articles by category for the sidebar
  const categoryCounts = ARTICLES.reduce(
    (acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <main id="main">
      {/* Header */}
      <section className="border-b-2 border-[#111111] py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <SectionLabel>Vol. I — Essays on Design &amp; Persuasion</SectionLabel>
          <h1 className="font-display text-h1 font-extrabold tracking-tighter text-[#111111]" style={{ lineHeight: 0.95 }}>
            Typography &amp; Conversion
          </h1>
          <p className="mt-6 max-w-2xl font-body text-lg leading-relaxed text-[#333333]">
            Where Swiss precision meets Madison Avenue pragmatism. Twenty essays on typography,
            layout, and visual communication — grounded in empirical research, not aesthetic opinion.
          </p>
          <p className="mt-3 font-body text-base leading-relaxed text-[#555555]">
            Every design choice must be justified by data, reader psychology, or conversion metrics.
            We do not design to win awards. We design to communicate.
          </p>
        </div>
      </section>

      {/* Article grid */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="grid grid-cols-1 gap-0 md:grid-cols-[220px_1fr] md:gap-16">
            {/* Sidebar — category index */}
            <aside className="hidden md:block">
              <div className="sticky top-16">
                <SectionLabel>Categories</SectionLabel>
                <div className="space-y-2">
                  {Object.entries(categoryCounts).map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="font-display text-[0.8125rem] text-[#333333]">{cat}</span>
                      <span className="font-mono text-[0.625rem] text-[#111111]/40">{count}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 border-t border-[#e5e5e0] pt-6">
                  <SectionLabel>About</SectionLabel>
                  <p className="font-body text-[0.8125rem] leading-relaxed text-[#555555]">
                    Written by an editorial team trained in the International Typographic Style
                    and direct-response advertising. Form follows function — and the function is to convert.
                  </p>
                </div>
              </div>
            </aside>

            {/* Article list */}
            <div>
              <SectionLabel>{ARTICLES.length} Essays</SectionLabel>
              <div>
                {ARTICLES.map((article, i) => (
                  <Link
                    key={article.slug}
                    href={`/journal/${article.slug}`}
                    className="journal-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="journal-card-meta">
                          <span>{article.category}</span>
                          <span className="mx-2">·</span>
                          <span>{article.readTime}</span>
                        </div>
                        <h2 className="journal-card-title mt-1.5">{article.title}</h2>
                        <p className="journal-card-excerpt">{article.description}</p>
                      </div>
                      <span className="mt-1 shrink-0 font-mono text-[0.625rem] text-[#111111]/25">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t-2 border-[#111111] py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50 mb-4">
            Put theory into practice
          </p>
          <h2 className="font-display text-h2 font-extrabold tracking-tighter text-[#111111]" style={{ lineHeight: 0.95 }}>
            Typeset your manuscript
          </h2>
          <p className="mt-4 max-w-lg font-body text-base text-[#444444]">
            Every principle in these essays is built into PagePerfect — baseline grids,
            golden-ratio scales, and 12 templates engineered for readability and conversion.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link
              href="/app"
              className="border border-[#FF3333] bg-[#FF3333] px-8 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white transition-all duration-75 hover:bg-[#E52222] hover:border-[#E52222]"
            >
              Open the Editor &rarr;
            </Link>
            <Link
              href="/docs"
              className="border border-[#111111]/20 px-8 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111]/50 transition-all duration-75 hover:border-[#111111] hover:text-[#111111]"
            >
              Read Docs
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
