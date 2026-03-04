'use client'

import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useState, useMemo, useCallback } from 'react'
import { Reveal } from '@/components/Reveal'
import { ARTICLES } from './articles'
import type { Article } from './articles'

const PAGE_SIZE = 25
const CATEGORIES = ['All', 'Typography', 'Layout', 'Conversion', 'Design Systems', 'Visual Communication'] as const

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50 mb-3">
      {children}
    </p>
  )
}

export default function JournalClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const activeCategory = searchParams.get('category') || 'All'
  const [visiblePages, setVisiblePages] = useState(1)

  // Category counts (always computed from full set)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of ARTICLES) {
      counts[a.category] = (counts[a.category] || 0) + 1
    }
    return counts
  }, [])

  // Filtered articles
  const filtered = useMemo(() => {
    if (activeCategory === 'All') return ARTICLES
    return ARTICLES.filter((a) => a.category === activeCategory)
  }, [activeCategory])

  // Paginated slice
  const visible = filtered.slice(0, visiblePages * PAGE_SIZE)
  const remaining = filtered.length - visible.length

  const setCategory = useCallback(
    (cat: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (cat === 'All') {
        params.delete('category')
      } else {
        params.set('category', cat)
      }
      setVisiblePages(1)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  return (
    <>
      {/* Article grid */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="grid grid-cols-1 gap-0 md:grid-cols-[220px_1fr] md:gap-16">
            {/* Mobile — horizontal scrollable category bar */}
            <div className="mb-6 md:hidden">
              <div className="scrollbar-hide -mx-6 flex gap-2 overflow-x-auto px-6 pb-2">
                {CATEGORIES.map((cat) => {
                  const count = cat === 'All' ? ARTICLES.length : (categoryCounts[cat] || 0)
                  const isActive = activeCategory === cat
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`inline-flex shrink-0 items-center gap-1.5 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors duration-200 ease-pp ${
                        isActive
                          ? 'journal-chip-active'
                          : 'border-[#111111]/10 text-[#333333]'
                      }`}
                    >
                      {cat}
                      <span className={isActive ? 'text-[#111111]/50' : 'text-[#111111]/30'}>{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Sidebar — category index (desktop) */}
            <aside className="hidden md:block">
              <div className="sticky top-16">
                <SectionLabel>Categories</SectionLabel>
                <div className="space-y-1">
                  {CATEGORIES.map((cat) => {
                    const count = cat === 'All' ? ARTICLES.length : (categoryCounts[cat] || 0)
                    const isActive = activeCategory === cat
                    return (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`flex w-full items-center justify-between py-1 text-left transition-colors duration-200 ease-pp ${
                          isActive
                            ? 'journal-category-active'
                            : ''
                        }`}
                      >
                        <span
                          className={`font-display text-[0.8125rem] ${
                            isActive ? 'text-[#111111] font-semibold' : 'text-[#333333] hover:text-[#111111]'
                          }`}
                        >
                          {cat}
                        </span>
                        <span className="font-mono text-[0.625rem] text-[#111111]/40">{count}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-8 border-t border-[#e5e5e0] pt-6">
                  <SectionLabel>About</SectionLabel>
                  <p className="font-body text-[0.8125rem] leading-relaxed text-[#4a4a4a]">
                    Written by an editorial team trained in the International Typographic Style
                    and direct-response advertising. Form follows function — and the function is to convert.
                  </p>
                </div>
              </div>
            </aside>

            {/* Article list */}
            <div>
              <SectionLabel>
                {activeCategory === 'All'
                  ? `${filtered.length} Essays`
                  : `${filtered.length} of ${ARTICLES.length} Essays — ${activeCategory}`}
              </SectionLabel>
              <div>
                {visible.map((article, i) => (
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

              {/* Show more */}
              {remaining > 0 && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setVisiblePages((p) => p + 1)}
                    className="inline-flex h-11 items-center justify-center border border-[#111111]/20 px-8 font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111]/50 transition-all duration-200 ease-pp hover:border-[#111111] hover:text-[#111111]"
                  >
                    Show {Math.min(remaining, PAGE_SIZE)} more of {remaining} remaining
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t-2 border-[#111111] py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <Reveal>
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50 mb-4">
            Put theory into practice
          </p>
          <h2 className="font-display text-h2 font-extrabold tracking-tighter text-[#111111]" style={{ lineHeight: 0.95 }}>
            Typeset your manuscript
          </h2>
          </Reveal>
          <p className="mt-4 max-w-lg font-body text-base text-[#4a4a4a]">
            Every principle in these essays is built into PagePerfect — baseline grids,
            golden-ratio scales, and 12 templates engineered for readability and conversion.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/app"
              className="inline-flex h-11 items-center justify-center border border-[#FF3333] bg-[#FF3333] px-8 font-mono text-[10px] uppercase tracking-[0.1em] text-white transition-all duration-200 ease-pp hover:bg-[#E52222] hover:border-[#E52222]"
            >
              Open the Editor &rarr;
            </Link>
            <Link
              href="/docs"
              className="inline-flex h-11 items-center justify-center border border-[#111111]/20 px-8 font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111]/50 transition-all duration-200 ease-pp hover:border-[#111111] hover:text-[#111111]"
            >
              Read Docs
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
