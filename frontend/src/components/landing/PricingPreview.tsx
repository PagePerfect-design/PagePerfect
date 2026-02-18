'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight, Check } from 'lucide-react'

const ease = [0.25, 0.4, 0.25, 1] as const

type Tier = {
  name: string
  price: string
  period: string
  desc: string
  cta: string
  href: string
  highlight: boolean
  features: string[]
}

const TIERS: Tier[] = [
  {
    name: 'Drafter',
    price: 'Free',
    period: 'forever',
    desc: 'Everything you need to start.',
    cta: 'Start Free',
    href: '/app',
    highlight: false,
    features: [
      'All 12 templates',
      '3 page sizes',
      'Real-time preview',
      'Markdown auto-clean',
      'Watermarked output',
    ],
  },
  {
    name: 'Single',
    price: '\u00a32.99',
    period: 'per PDF',
    desc: 'One clean export, no subscription.',
    cta: 'Buy One',
    href: '/pricing',
    highlight: false,
    features: [
      'No watermark',
      'All 11 page sizes',
      'Full quality compile',
      'Print-ready output',
      'No subscription',
    ],
  },
  {
    name: 'Publisher',
    price: '$9.99',
    period: '/mo',
    desc: 'Unlimited clean exports.',
    cta: 'Go Pro',
    href: '/pricing',
    highlight: true,
    features: [
      'Everything in Drafter',
      'Unlimited exports',
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
    href: '/pricing',
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

function TierCard({ tier, index, inView }: { tier: Tier; index: number; inView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease }}
      className={`group relative border transition-colors duration-300 ${
        tier.highlight
          ? 'border-[#0033ff]/30 bg-[#0033ff]/[0.03]'
          : 'border-white/[0.06] bg-white/[0.01]'
      } hover:border-white/[0.12]`}
    >
      {/* Highlight label */}
      {tier.highlight && (
        <div className="absolute -top-px left-0 right-0 flex justify-center">
          <div className="bg-[#0033ff] px-4 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-white">
            Most popular
          </div>
        </div>
      )}

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/45">
            {tier.name}
          </p>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-display text-5xl font-extrabold leading-[0.9] tracking-tighter text-white">
              {tier.price}
            </span>
            <span className="font-mono text-[11px] text-white/40">{tier.period}</span>
          </div>
          <p className="mt-3 font-body text-[15px] leading-relaxed text-white/55">{tier.desc}</p>
        </div>

        <div className={`mb-6 h-px ${tier.highlight ? 'bg-[#0033ff]/20' : 'bg-white/[0.06]'}`} />

        {/* Features */}
        <ul className="mb-8 space-y-3">
          {tier.features.map((f) => (
            <li key={f} className="flex items-start gap-3 font-body text-[14px] text-white/55">
              <Check className={`mt-0.5 h-4 w-4 flex-shrink-0 ${tier.highlight ? 'text-[#0033ff]/70' : 'text-white/30'}`} />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href={tier.href}
          className={`group/btn flex h-12 w-full items-center justify-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] transition-all duration-200 ${
            tier.highlight
              ? 'bg-[#0033ff] text-white hover:bg-[#2255ff]'
              : 'border border-white/[0.12] text-white/60 hover:border-white/[0.25] hover:text-white/80'
          }`}
        >
          {tier.cta}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
        </Link>
      </div>
    </motion.div>
  )
}

export function PricingPreview() {
  const ref = useRef(null)
  const headerRef = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })

  return (
    <section className="relative py-32 md:py-44">
      <div className="relative mx-auto max-w-5xl px-6 md:px-8">

        {/* ── HEADER — editorial ── */}
        <div ref={headerRef} className="mb-16 max-w-2xl md:mb-20">
          <motion.p
            initial={{ opacity: 0 }}
            animate={headerInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, ease }}
            className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40"
          >
            Pricing
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="font-display text-display-lg font-extrabold leading-[0.9] tracking-tighter text-white"
          >
            Simple pricing.
            <br />
            No surprises.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="mt-6 font-body text-lg leading-relaxed text-white/50"
          >
            Start free. Upgrade when your book is ready.
          </motion.p>
        </div>

        <div ref={ref} className="grid grid-cols-1 gap-px bg-white/[0.06] md:grid-cols-4">
          {TIERS.map((tier, i) => (
            <TierCard key={tier.name} tier={tier} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  )
}
