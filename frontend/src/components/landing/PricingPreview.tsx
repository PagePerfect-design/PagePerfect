import Link from 'next/link'

const TIERS = [
  {
    num: '01',
    name: 'Drafter',
    price: 'Free',
    period: 'forever',
    body: 'Everything you need to start. All 12 typographic systems, 6 page sizes, real-time preview. Unlimited manuscripts, unlimited compiles.',
    aside: 'Watermarked output. Upgrade when your book is ready for print.',
  },
  {
    num: '02',
    name: 'Single',
    price: '\u00a32.99',
    period: 'per PDF',
    body: 'One clean, watermark-free export. All 19 page sizes including Amazon KDP formats. Full quality compile, print-ready output.',
    aside: 'No subscription. Pay only when you need a clean export.',
  },
  {
    num: '03',
    name: 'Publisher',
    price: '$9.99',
    period: '/month',
    recommended: true,
    body: 'Unlimited watermark-free exports for serious authors. Citations and bibliography support, priority compile queue, PDF/X compliance.',
    aside: 'Cancel anytime. Most authors choose this.',
  },
  {
    num: '04',
    name: 'Studio',
    price: '$199',
    period: 'once',
    body: 'Lifetime Publisher access. No monthly fees, ever. EPUB export, custom font upload, and batch export for series \u2014 all included.',
    aside: 'Pay once, own it forever. For publishers and prolific authors.',
  },
] as const

export function PricingPreview() {
  return (
    <section className="relative border-t-2 border-[#111111] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-8">

        {/* ── Header ── */}
        <div className="mb-12 max-w-2xl md:mb-16">
          <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">
            Rate Card
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] font-extrabold leading-[0.88] tracking-tighter text-[#111111]">
            Start free.
            <br />
            Upgrade when ready.
          </h2>
          <p className="mt-5 font-body text-sm leading-[1.7] text-[#111111]/45">
            The free tier is genuinely useful &mdash; not a demo.
            All 12 typographic systems, unlimited manuscripts, real-time preview.
          </p>
        </div>

        {/* ── Tier Rows ── */}
        <div>
          {TIERS.map((tier) => (
            <div key={tier.num}>
              <div className="h-px bg-[#111111]/10" />
              <div className="grid grid-cols-1 gap-4 py-10 md:grid-cols-[5rem_1fr_1fr] md:items-baseline md:gap-10 md:py-14">
                {/* Tier number */}
                <span className="font-display text-[3rem] font-extrabold leading-none tracking-tighter text-[#111111]/[0.06] md:text-[4rem]">
                  {tier.num}
                </span>

                {/* Name + description */}
                <div>
                  <div className="flex items-baseline gap-4">
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#111111]/70">
                      {tier.name}
                    </h3>
                    {'recommended' in tier && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#0033ff]">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-3 font-body text-[13px] leading-[1.7] text-[#111111]/45">
                    {tier.body}
                  </p>
                </div>

                {/* Price + aside */}
                <div className="border-l border-[#111111]/10 pl-5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-[2rem] font-extrabold leading-none tracking-tighter text-[#111111] md:text-[2.5rem]">
                      {tier.price}
                    </span>
                    <span className="font-mono text-[10px] text-[#111111]/30">{tier.period}</span>
                  </div>
                  <p className="mt-2 font-body text-[12px] italic leading-[1.7] text-[#111111]/35">
                    {tier.aside}
                  </p>
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
