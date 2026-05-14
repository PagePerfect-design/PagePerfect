'use client'

import Link from 'next/link'
import { Reveal } from '@/components/Reveal'

const TIERS = [
  {
    num: '01',
    key: 'drafter',
    name: 'Drafter',
    price: 'Free',
    period: 'forever',
    body: 'Everything you need to draft and test. All 15 templates, unlimited manuscripts, real-time preview. Watermarked output.',
    aside: 'Zero friction. See your book professionally formatted before you pay a cent.',
    cta: 'Start Drafting',
    href: '/app',
  },
  {
    num: '02',
    key: 'publisher',
    name: 'Publisher',
    price: '$19.99',
    period: 'per manuscript',
    recommended: true,
    body: 'One flawless, print-ready manuscript. PDF/X-1a compliance for Amazon KDP and IngramSpark. All 19 page sizes, citations, bibliography. 14 days of unlimited re-exports.',
    aside: 'No subscription. Pay only when the book is finished.',
    cta: 'Typeset My Book',
    href: '/pricing',
  },
  {
    num: '03',
    key: 'studio',
    name: 'Studio',
    price: '$199',
    period: 'once',
    body: 'Lifetime access to the engine. Unlimited exports, automated EPUB generation, custom OpenType font uploads, and batch exporting for multi-book series.',
    aside: 'Pay once, own it forever. For prolific authors and publishers.',
    cta: 'Get Studio',
    href: '/pricing',
  },
] as const

export function PricingPreview() {
  return (
    <section className="relative border-t-2 border-[#111111] bg-[#FDFCF8] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-8">

        {/* ── Header ── */}
        <Reveal>
          <div className="mb-12 max-w-2xl md:mb-16">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-[#111111]">
              Pricing
            </p>
            <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] font-extrabold leading-[0.88] tracking-tighter text-[#111111]">
              Start free.
              <br />
              Upgrade when ready.
            </h2>
            <p className="mt-6 font-body text-lg leading-relaxed text-[#111111]/60">
              The free tier is genuinely useful &mdash; not a demo.
              All 15 professional book designs, unlimited manuscripts, real-time preview.
            </p>
          </div>
        </Reveal>

        {/* ── Tier Rows ── */}
        <div>
          {TIERS.map((tier, i) => (
            <Reveal key={tier.num} delay={i * 0.08}>
              <div className="group">
                <div className="h-px bg-[#111111]/10" />
                <div className="grid grid-cols-1 gap-4 py-12 md:grid-cols-[6rem_1fr_1fr] md:items-baseline md:gap-12 md:py-16">
                  {/* Tier number — large, ghosted */}
                  <span className="font-display text-[4rem] font-extrabold leading-none tracking-tighter text-[#111111]/[0.06] transition-colors duration-350 ease-pp group-hover:text-[#FF3333]/20 md:text-[5rem]">
                    {tier.num}
                  </span>

                  {/* Name + description */}
                  <div>
                    <div className="flex items-baseline gap-4">
                      <h3 className="font-mono text-[13px] uppercase tracking-[0.15em] text-[#111111]">
                        {tier.name}
                      </h3>
                      {'recommended' in tier && (
                        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#FF3333]">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="mt-4 font-body text-[15px] leading-relaxed text-[#111111]/60 md:text-base">
                      {tier.body}
                    </p>
                  </div>

                  {/* Price + aside + CTA */}
                  <div className="border-l border-[#111111] pl-6">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-[2rem] font-extrabold leading-none tracking-tighter text-[#111111] md:text-[2.5rem]">
                        {tier.price}
                      </span>
                      <span className="font-mono text-[11px] text-[#111111]/50">{tier.period}</span>
                    </div>
                    <p className="mt-3 font-mono text-[12px] leading-relaxed text-[#111111]/50">
                      {tier.aside}
                    </p>

                    {/* CTA */}
                    <div className="mt-5">
                      <Link
                        href={tier.href}
                        className={`group/btn inline-flex h-10 items-center gap-2 px-6 font-mono text-[11px] uppercase tracking-[0.1em] transition-all duration-200 ${
                          tier.key === 'publisher'
                            ? 'bg-[#FF3333] text-white hover:bg-[#E52222]'
                            : tier.key === 'studio'
                              ? 'bg-[#111111] text-white hover:bg-[#111111]/90'
                              : 'border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white'
                        }`}
                      >
                        {tier.cta}
                        <svg className="h-3 w-3 transition-transform duration-200 group-hover/btn:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
          <div className="h-px bg-[#111111]/10" />
        </div>

        {/* ── Footer ── */}
        <Reveal delay={0.3}>
          <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/pricing"
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111] underline underline-offset-4 transition-colors duration-200 ease-pp hover:text-[#111111]"
            >
              Compare all plans &amp; FAQ &rarr;
            </Link>
            <Link
              href="/app"
              className="inline-flex h-12 items-center border border-[#111111] bg-[#111111] px-10 font-mono text-[10px] uppercase tracking-[0.12em] text-white transition-all duration-200 ease-pp hover:bg-transparent hover:text-[#111111]"
            >
              Open the Editor
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
