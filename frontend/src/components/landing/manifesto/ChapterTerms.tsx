'use client'

import Link from 'next/link'
import { Reveal, RevealGroup } from '@/components/Reveal'
import { ChapterOpener } from './ChapterOpener'
import { FootnoteRef, FootnoteList } from './Footnote'

const TIERS = [
  {
    roman: 'I',
    name: 'Drafter',
    price: 'Free',
    period: 'forever',
    body: 'All 15 templates, unlimited manuscripts, real-time preview. Watermarked output. Zero friction.',
    cta: 'Start drafting',
    href: '/app',
    variant: 'outlined' as const,
  },
  {
    roman: 'II',
    name: 'Publisher',
    price: '$19.99',
    period: 'per manuscript',
    body: 'One flawless, print-ready manuscript. PDF/X-1a for KDP and IngramSpark. All 19 page sizes. 14 days of re-exports.',
    cta: 'Typeset my book',
    href: '/pricing',
    variant: 'primary' as const,
    recommended: true,
  },
  {
    roman: 'III',
    name: 'Studio',
    price: '$199',
    period: 'once',
    body: 'Lifetime access. Unlimited exports, EPUB generation, custom OpenType uploads, batch export for multi-book series.',
    cta: 'Get Studio',
    href: '/pricing',
    variant: 'black' as const,
  },
] as const

export function ChapterTerms() {
  return (
    <section id="ch-v" className="relative border-b border-[#111111] bg-[#FDFCF8] px-6 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-6xl">
        <ChapterOpener
          numeral="V"
          title="The Terms"
          kicker="05 · Pricing as subscription terms"
        >
          <p>
            Three offers. No subscription unless you ask for one. The free
            tier is genuinely useful — not a demo. Pay only when the book is
            finished and you need a watermark-free export<FootnoteRef chapter="v" n={1} />.
          </p>
        </ChapterOpener>

        <RevealGroup staggerDelay={0.07} className="mt-16">
          {TIERS.map((tier) => (
            <div key={tier.roman}>
              <div className="h-px bg-[#111111]/15" />
              <div className="grid grid-cols-1 gap-6 py-12 md:grid-cols-[4rem_1fr_1fr] md:items-baseline md:gap-12 md:py-16">
                <span
                  className="font-display font-extrabold leading-none tracking-tighter text-[#111111]/[0.08]"
                  style={{ fontSize: 'clamp(3rem, 6vw, 5rem)' }}
                  aria-hidden="true"
                >
                  {tier.roman}
                </span>

                <div>
                  <div className="flex items-baseline gap-4">
                    <h3 className="font-mono text-[13px] uppercase tracking-[0.15em] text-[#111111]">
                      Subscription {tier.roman} · {tier.name}
                    </h3>
                    {'recommended' in tier && tier.recommended && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#FF3333]">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-4 max-w-md font-body text-[15px] leading-7 text-[#333333]">
                    {tier.body}
                  </p>
                </div>

                <div className="border-l border-[#111111] pl-6">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="font-display font-extrabold leading-none tracking-tighter text-[#111111]"
                      style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)' }}
                    >
                      {tier.price}
                    </span>
                    <span className="font-mono text-[11px] text-[#555555]">{tier.period}</span>
                  </div>

                  <div className="mt-6">
                    <Link
                      href={tier.href}
                      className={
                        'inline-flex h-12 items-center px-8 font-mono text-[11px] uppercase tracking-[0.1em] transition-[background-color,color,transform] duration-200 ease-pp active:scale-[0.97] ' +
                        (tier.variant === 'primary'
                          ? 'bg-[#FF3333] text-white hover:bg-[#E52222]'
                          : tier.variant === 'black'
                            ? 'bg-[#111111] text-white hover:bg-[#111111]/85'
                            : 'border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white')
                      }
                    >
                      {tier.cta} →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="h-px bg-[#111111]/15" />
        </RevealGroup>

        <Reveal direction="up" delay={0.2} blur={false}>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/pricing"
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111] underline underline-offset-4 hover:text-[#FF3333]"
            >
              Compare all plans & FAQ →
            </Link>
          </div>
        </Reveal>

        <FootnoteList
          chapter="v"
          notes={[
            { n: 1, text: <span>Refunds available within 14 days, conditional on zero unwatermarked exports. Tier resets to <em>Drafter</em> on qualifying refund.</span> },
          ]}
        />
      </div>
    </section>
  )
}
