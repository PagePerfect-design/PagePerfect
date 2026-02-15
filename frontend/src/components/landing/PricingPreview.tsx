import Link from 'next/link'
import { Reveal } from './Reveal'

const TIERS = [
  {
    name: 'Drafter',
    price: 'Free',
    period: 'forever',
    desc: 'Everything you need to start.',
    cta: 'Start Free',
    href: '/app',
    highlight: false,
    features: [
      'All 8 templates',
      '3 page sizes',
      'Real-time preview',
      'Markdown auto-clean',
      'Watermarked output',
    ],
  },
  {
    name: 'Publisher',
    price: '$9.99',
    period: '/month',
    desc: 'Clean exports for serious authors.',
    cta: 'Go Pro',
    href: '/auth/login?next=/app',
    highlight: true,
    features: [
      'Everything in Drafter',
      'No watermark',
      'All 11 page sizes',
      'Citations & bibliography',
      'Priority compile queue',
    ],
  },
  {
    name: 'Studio',
    price: '$199',
    period: 'once',
    desc: 'Lifetime access. Pay once, own it.',
    cta: 'Get Studio',
    href: '/auth/login?next=/app',
    highlight: false,
    features: [
      'Everything in Publisher',
      'No monthly fees, ever',
      'EPUB export (coming)',
      'Custom fonts (coming)',
      'Direct support',
    ],
  },
]

export function PricingPreview() {
  return (
    <section className="py-32 md:py-44">
      <div className="mx-auto max-w-5xl px-6 md:px-8">
        <Reveal>
          <div className="mb-16 text-center md:mb-20">
            <h2 className="font-display text-display-lg font-bold tracking-[-0.03em] text-text-primary">
              Pricing that respects your budget.
            </h2>
            <p className="mt-4 text-xl text-text-secondary">
              Start free. Upgrade when your book is ready.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-6 transition-all duration-300 md:p-8 ${
                  tier.highlight
                    ? 'border-accent/30 bg-accent/[0.04] shadow-glow-accent'
                    : 'border-white/[0.06] bg-surface-raised'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-white">
                    Most popular
                  </div>
                )}

                <div className="mb-6">
                  <div className="font-mono text-xs uppercase tracking-widest text-text-ghost">
                    {tier.name}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold text-text-primary">
                      {tier.price}
                    </span>
                    <span className="text-sm text-text-ghost">{tier.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">{tier.desc}</p>
                </div>

                <ul className="mb-8 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.href}
                  className={`group flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    tier.highlight
                      ? 'bg-accent text-white hover:bg-accent-hover hover:shadow-pill-hover'
                      : 'border border-white/10 text-text-primary hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  {tier.cta}
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
