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

function StatementRow({ s, index }: { s: (typeof STATEMENTS)[number]; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1, ease }}
      className="group"
    >
      <div className="grid grid-cols-1 gap-3 py-12 md:grid-cols-[5rem_1fr] md:items-baseline md:gap-8 md:py-16">
        {/* Number */}
        <span className="font-display text-[3.5rem] font-extrabold leading-none tracking-tighter text-white/[0.07] transition-colors duration-500 group-hover:text-[#0033ff]/[0.15] md:text-6xl">
          {s.num}
        </span>

        <div>
          <h3 className="font-display text-2xl font-bold leading-[1.05] tracking-tight text-white/90 md:text-3xl lg:text-[2.5rem]">
            {s.headline}
          </h3>
          <p className="mt-4 max-w-xl font-body text-[15px] leading-relaxed text-white/55 md:text-base lg:text-lg">
            {s.body}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export function WhyDifferent() {
  const sectionRef = useRef(null)
  const headerRef = useRef(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1.05, 1])

  return (
    <section ref={sectionRef} className="relative overflow-hidden">

      {/* ── Background image — confident, not at 2% opacity ── */}
      <motion.div
        className="absolute inset-x-0 -bottom-[10%] -top-[10%]"
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

      {/* ── Scrim for text readability — simple, no color wash ── */}
      <div className="absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#050505] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050505] to-transparent" />
        <div className="absolute inset-0 bg-[#050505]/70" />
      </div>

      {/* ── Content ── */}
      <div className="relative py-32 md:py-44">
        <div className="mx-auto max-w-5xl px-6 md:px-8">

          {/* ── Heading ── */}
          <div ref={headerRef} className="mb-20 max-w-3xl md:mb-28">
            <motion.p
              initial={{ opacity: 0 }}
              animate={headerInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, ease }}
              className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40"
            >
              Philosophy
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={headerInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1, ease }}
              className="font-display text-display-lg font-extrabold leading-[0.9] tracking-tighter text-white"
            >
              Not just formatted.
              <br />
              Typeset.
            </motion.h2>
          </div>

          {/* ── Statement rows ── */}
          <div>
            {STATEMENTS.map((s, i) => (
              <div key={i}>
                <div className="h-px bg-white/[0.08]" />
                <StatementRow s={s} index={i} />
              </div>
            ))}
            <div className="h-px bg-white/[0.08]" />
          </div>
        </div>
      </div>
    </section>
  )
}
