'use client'

import { Fragment, useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const ease = [0.25, 0.4, 0.25, 1] as const

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

function TierRow({ tier, index }: { tier: typeof TIERS[number]; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.08, ease }}
      className="group"
    >
      <div className="grid grid-cols-1 gap-4 py-12 md:grid-cols-[6rem_1fr_1fr] md:items-baseline md:gap-12 md:py-16">
        {/* Tier number — large, ghosted */}
        <span className="font-display text-[4rem] font-extrabold leading-none tracking-tighter text-white/[0.07] transition-colors duration-500 group-hover:text-[#0033ff]/[0.15] md:text-[5rem]">
          {tier.num}
        </span>

        {/* Name + description — editorial */}
        <div>
          <div className="flex items-baseline gap-4">
            <h3 className="font-mono text-[13px] uppercase tracking-[0.15em] text-white/70">
              {tier.name}
            </h3>
            {'recommended' in tier && (
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#0033ff]">
                Recommended
              </span>
            )}
          </div>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-white/55 md:text-base">
            {tier.body}
          </p>
        </div>

        {/* Price + aside */}
        <div className="border-l border-white/[0.08] pl-6">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[2rem] font-extrabold leading-none tracking-tighter text-white md:text-[2.5rem]">
              {tier.price}
            </span>
            <span className="font-mono text-[11px] text-white/35">{tier.period}</span>
          </div>
          <p className="mt-3 font-body text-[14px] leading-relaxed text-white/40 italic md:text-[15px]">
            {tier.aside}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export function PricingPreview() {
  const headerRef = useRef(null)
  const footerRef = useRef(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })
  const footerInView = useInView(footerRef, { once: true, margin: '-60px' })

  return (
    <section className="relative py-32 md:py-44">
      <div className="relative mx-auto max-w-6xl px-6 md:px-8">

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
            The free tier is genuinely useful &mdash; not a demo.
            All 12 typographic systems, unlimited manuscripts, real-time preview.
          </motion.p>
        </div>

        {/* ── TIER ROWS ── */}
        <div>
          {TIERS.map((tier, i) => (
            <Fragment key={tier.num}>
              <div className="h-px bg-white/[0.06]" />
              <TierRow tier={tier} index={i} />
            </Fragment>
          ))}
          <div className="h-px bg-white/[0.06]" />
        </div>

        {/* ── FOOTER ── */}
        <motion.div
          ref={footerRef}
          initial={{ opacity: 0 }}
          animate={footerInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3, ease }}
          className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <Link
            href="/pricing"
            className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40 transition-colors hover:text-white/70"
          >
            Compare all plans &amp; FAQ
            <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/app"
            className="group inline-flex h-13 items-center gap-3 bg-[#0033ff] px-10 font-display text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#2255ff]"
          >
            Open the Editor
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
