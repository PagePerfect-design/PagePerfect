import Link from 'next/link'

const TIERS = [
  {
    num: '01',
    key: 'drafter',
    name: 'Drafter',
    price: 'Free',
    period: 'forever',
    body: 'Everything you need to start. All 15 templates \u00d7 3 heading variants = 45 styles, 6 page sizes, real-time preview. Unlimited manuscripts, unlimited compiles.',
    aside: 'Watermarked output. Upgrade when your book is ready for print.',
    cta: 'Start Free',
    href: '/app',
  },
  {
    num: '02',
    key: 'single',
    name: 'Single',
    price: '$2.99',
    period: 'per PDF',
    body: 'One clean, watermark-free export. All 19 page sizes including Amazon KDP formats. Full quality compile, print-ready output.',
    aside: 'No subscription. Pay only when you need a clean export.',
    cta: 'Buy One PDF',
    href: '/pricing',
  },
  {
    num: '03',
    key: 'publisher',
    name: 'Publisher',
    price: '$9.99',
    period: '/month',
    recommended: true,
    body: 'Unlimited watermark-free exports for serious authors. Citations and bibliography support, priority compile queue, PDF/X compliance.',
    aside: 'Cancel anytime. Most authors choose this.',
    cta: 'Start Publishing',
    href: '/pricing',
  },
  {
    num: '04',
    key: 'studio',
    name: 'Studio',
    price: '$199',
    period: 'once',
    body: 'Lifetime Publisher access. No monthly fees, ever. EPUB export, custom font upload, batch export for series \u2014 all included.',
    aside: 'Pay once, own it forever. For publishers and prolific authors.',
    cta: 'Get Studio',
    href: '/pricing',
  },
] as const

export function PricingPreview() {
  return (
    <section className="relative border-t-2 border-[#111111] bg-[#FDFCF8] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-8">

        {/* ── Header ── */}
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
            All 15 typographic systems, unlimited manuscripts, real-time preview.
          </p>
        </div>

        {/* ── Tier Rows ── */}
        <div>
          {TIERS.map((tier) => (
            <div key={tier.num} className="group">
              <div className="h-px bg-[#111111]/10" />
              <div className="grid grid-cols-1 gap-4 py-12 md:grid-cols-[6rem_1fr_1fr] md:items-baseline md:gap-12 md:py-16">
                {/* Tier number — large, ghosted */}
                <span className="font-display text-[4rem] font-extrabold leading-none tracking-tighter text-[#111111]/[0.06] transition-colors duration-500 group-hover:text-[#FF3333]/20 md:text-[5rem]">
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
                          : tier.key === 'drafter'
                            ? 'border border-[#111111] bg-[#111111] text-white hover:bg-transparent hover:text-[#111111]'
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
          ))}
          <div className="h-px bg-[#111111]/10" />
        </div>

        {/* ── Footer ── */}
        <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/pricing"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111]/35 transition-colors duration-75 hover:text-[#111111]"
          >
            Compare all plans &amp; FAQ &rarr;
          </Link>
          <Link
            href="/app"
            className="inline-flex h-12 items-center border border-[#111111] bg-[#111111] px-10 font-mono text-[10px] uppercase tracking-[0.12em] text-white transition-all duration-75 hover:bg-transparent hover:text-[#111111]"
          >
            Open the Editor
          </Link>
        </div>
      </div>
    </section>
  )
}
