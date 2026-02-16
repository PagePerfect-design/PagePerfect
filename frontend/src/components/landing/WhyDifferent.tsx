'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'

const ease = [0.25, 0.4, 0.25, 1] as const

const STATEMENTS = [
  {
    num: '01',
    headline: 'Your pages have rhythm.',
    body: 'Every line sits on a mathematical baseline grid \u2014 the same technique used by Penguin, Oxford University Press, and every book you\u2019ve admired on a shelf.',
  },
  {
    num: '02',
    headline: 'Your paragraphs breathe.',
    body: 'Our engine analyzes entire paragraphs to find optimal line breaks. Word goes line by line. We see the whole picture.',
  },
  {
    num: '03',
    headline: 'Your book is print-ready.',
    body: 'PDFs that pass KDP\u2019s automated review on the first try. Correct bleed, margins, and trim for 11 standard book sizes.',
  },
]

// ── Statement row with scroll-triggered entrance ─────────────────
function StatementRow({ s, index }: { s: (typeof STATEMENTS)[number]; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease }}
      className="group relative"
    >
      {/* Hover accent bar */}
      <div className="pointer-events-none absolute -left-4 bottom-0 top-0 w-[2px] bg-gradient-to-b from-accent/0 via-accent/40 to-accent/0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 md:-left-6" />

      <div className="grid grid-cols-1 gap-3 py-10 md:grid-cols-[5rem_1fr] md:items-baseline md:gap-8 md:py-14">
        {/* Big number */}
        <span className="font-display text-[3.5rem] font-bold leading-none tracking-tighter text-white/[0.06] transition-colors duration-500 group-hover:text-accent/[0.12] md:text-6xl">
          {s.num}
        </span>

        <div>
          <h3 className="font-display text-2xl font-bold leading-[1.05] tracking-tight text-white/90 md:text-3xl lg:text-[2.5rem]">
            {s.headline}
          </h3>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/30 md:mt-4 md:text-base lg:text-lg">
            {s.body}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main section ─────────────────────────────────────────────────
export function WhyDifferent() {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  // Multi-speed parallax transforms
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1.05, 1])
  const gridY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])
  const headingY = useTransform(scrollYProgress, [0, 1], ['0px', '50px'])

  return (
    <section ref={sectionRef} className="section-separator relative overflow-hidden">

      {/* ── Layer 1: Parallax background image ── */}
      <motion.div
        className="absolute inset-x-0 -bottom-[15%] -top-[15%]"
        style={{ y: imageY, scale: imageScale }}
      >
        <Image
          src="/images/book-tunnel.webp"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
      </motion.div>

      {/* ── Layer 2: Edge fades + center scrim ── */}
      <div className="absolute inset-0">
        {/* Top edge → void */}
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-void to-transparent" />
        {/* Bottom edge → void */}
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-void to-transparent" />
        {/* Center darken for text readability */}
        <div className="absolute inset-0 bg-void/[0.68]" />
      </div>

      {/* ── Layer 3: Warm color wash (matches image warmth) ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(180,120,60,0.06)_0%,transparent_70%)]" />

      {/* ── Layer 4: Baseline grid lines at different parallax speed ── */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 -bottom-[10%] -top-[10%]"
        style={{ y: gridY }}
      >
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(255,255,255,0.018) 27px, rgba(255,255,255,0.018) 28px)',
          }}
        />
      </motion.div>

      {/* ── Layer 5: Film grain texture ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Content ── */}
      <div className="relative py-32 md:py-44">
        <div className="mx-auto max-w-5xl px-6 md:px-8">

          {/* ── Heading with gentle parallax ── */}
          <motion.div style={{ y: headingY }} className="mb-20 text-center md:mb-28">
            <motion.div
              initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.9, ease }}
            >
              <h2 className="text-glow headline-glow font-display text-display-lg font-bold leading-[0.9] tracking-tighter text-white">
                Not just formatted.{' '}
                <span className="gradient-hero-text">
                  Typeset.
                </span>
              </h2>

              {/* Decorative diamond rule */}
              <div className="mx-auto mt-8 flex max-w-[200px] items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/15" />
                <div className="h-1.5 w-1.5 rotate-45 border border-white/20" />
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/15" />
              </div>
            </motion.div>
          </motion.div>

          {/* ── Statement rows ── */}
          <div>
            {STATEMENTS.map((s, i) => (
              <div key={i}>
                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                <StatementRow s={s} index={i} />
              </div>
            ))}
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          </div>

        </div>
      </div>
    </section>
  )
}
