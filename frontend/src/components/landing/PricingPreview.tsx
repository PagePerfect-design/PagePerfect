'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight, Check } from 'lucide-react'

// LAW 1: Spring physics
const spring = { type: 'spring' as const, stiffness: 100, damping: 20 }

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
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section data-theme="light" className="section-separator relative bg-surface py-32 md:py-44">
      {/* Subtle accent glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(37,99,235,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="mb-16 text-center md:mb-20"
        >
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-accent/70">Pricing</div>
          <h2 className="font-display text-display-lg font-bold leading-[0.9] tracking-tighter text-text-primary">
            Pricing that{' '}
            <span className="gradient-accent-text">respects</span>{' '}
            your budget.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-xl text-text-secondary">
            Start free. Upgrade when your book is ready.
          </p>
        </motion.div>

        <div ref={ref} className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ ...spring, delay: i * 0.12 }}
              className={`group relative overflow-hidden rounded-2xl border transition-all duration-500 ${
                tier.highlight
                  ? 'border-accent/30 bg-white shadow-[0_4px_32px_-8px_rgba(37,99,235,0.15)] hover:shadow-[0_8px_40px_-8px_rgba(37,99,235,0.2)]'
                  : 'border-border bg-surface-raised shadow-card hover:border-border-visible hover:shadow-card-hover'
              } hover:-translate-y-1`}
            >
              {tier.highlight && (
                <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.04] via-transparent to-transparent" />
              )}
              {tier.highlight && (
                <div className="absolute -top-px left-0 right-0 flex justify-center">
                  <div className="rounded-b-lg bg-accent px-4 py-1 text-[11px] font-semibold tracking-wide text-white shadow-[0_4px_20px_-4px_rgba(37,99,235,0.5)]">
                    Most popular
                  </div>
                </div>
              )}

              <div className="relative p-6 md:p-8">
                <div className="mb-8">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
                    {tier.name}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="font-display text-5xl font-bold leading-[0.9] tracking-tighter text-text-primary">
                      {tier.price}
                    </span>
                    <span className="text-sm text-text-tertiary">{tier.period}</span>
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">{tier.desc}</p>
                </div>

                <div className={`mb-6 h-px ${tier.highlight ? 'bg-accent/20' : 'bg-border'}`} />

                <ul className="mb-8 space-y-3.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[14px] text-text-secondary">
                      <Check className={`mt-0.5 h-4 w-4 flex-shrink-0 ${tier.highlight ? 'text-accent' : 'text-text-tertiary'}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.href}
                  className={`group/btn flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                    tier.highlight
                      ? 'bg-accent text-white shadow-[0_0_30px_-8px_rgba(37,99,235,0.4)] hover:bg-accent-hover hover:shadow-[0_0_40px_-8px_rgba(37,99,235,0.5)]'
                      : 'border border-border text-text-secondary hover:border-border-visible hover:bg-surface-glass hover:text-text-primary'
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
