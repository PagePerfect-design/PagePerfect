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
  highlight: boolean
  features: string[]
}

const TIERS: Tier[] = [
  {
    name: 'Drafter',
    price: 'Free',
    period: 'forever',
    desc: 'All 12 templates. Real-time preview. Watermarked output.',
    highlight: false,
    features: ['All 12 templates', '6 page sizes', 'Watermarked output'],
  },
  {
    name: 'Single',
    price: '\u00a32.99',
    period: 'per PDF',
    desc: 'One clean, watermark-free export. No subscription.',
    highlight: false,
    features: ['No watermark', 'All 19 page sizes', 'Print-ready output'],
  },
  {
    name: 'Publisher',
    price: '$9.99',
    period: '/mo',
    desc: 'Unlimited clean exports for serious authors.',
    highlight: true,
    features: ['Unlimited exports', 'Citations & bibliography', 'Priority queue'],
  },
  {
    name: 'Studio',
    price: '$199',
    period: 'once',
    desc: 'Lifetime Publisher access. Pay once, own it forever.',
    highlight: false,
    features: ['Everything in Publisher', 'No monthly fees, ever', 'EPUB export (coming)'],
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
      {tier.highlight && (
        <div className="absolute -top-px left-0 right-0 flex justify-center">
          <div className="bg-[#0033ff] px-4 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-white">
            Most popular
          </div>
        </div>
      )}

      <div className="p-6 md:p-8">
        {/* Price */}
        <div className="mb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/45">
            {tier.name}
          </p>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-display text-4xl font-extrabold leading-[0.9] tracking-tighter text-white md:text-5xl">
              {tier.price}
            </span>
            <span className="font-mono text-[11px] text-white/40">{tier.period}</span>
          </div>
        </div>

        <div className={`mb-5 h-px ${tier.highlight ? 'bg-[#0033ff]/20' : 'bg-white/[0.06]'}`} />

        {/* Key features */}
        <ul className="space-y-2.5">
          {tier.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 font-body text-[13px] text-white/50">
              <Check className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${tier.highlight ? 'text-[#0033ff]/70' : 'text-white/25'}`} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
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

        {/* ── HEADER ── */}
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
            Start free.
            <br />
            Upgrade when ready.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="mt-6 font-body text-lg leading-relaxed text-white/50"
          >
            The free tier is genuinely useful &mdash; not a demo. All 12 templates, real-time preview, unlimited manuscripts.
          </motion.p>
        </div>

        {/* ── TIER GRID ── */}
        <div ref={ref} className="grid grid-cols-1 gap-px bg-white/[0.06] sm:grid-cols-2 md:grid-cols-4">
          {TIERS.map((tier, i) => (
            <TierCard key={tier.name} tier={tier} index={i} inView={inView} />
          ))}
        </div>

        {/* ── FOOTER LINKS ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5, ease }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-between"
        >
          <Link
            href="/pricing"
            className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-white/45 transition-colors hover:text-white/70"
          >
            Compare all plans &amp; FAQ
            <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/app"
            className="group inline-flex h-12 items-center gap-3 bg-[#0033ff] px-8 font-display text-[14px] font-semibold text-white transition-all duration-200 hover:bg-[#2255ff]"
          >
            Open the Editor
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
