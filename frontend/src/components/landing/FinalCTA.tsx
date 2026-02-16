'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 }

export function FinalCTA() {
  const sectionRef = useRef(null)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  // Subtle ambient drift on scroll
  const glowY = useTransform(scrollYProgress, [0, 1], [40, -40])
  const glowScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.1, 0.9])

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-32 text-center md:py-44">
      {/* Layered ambient glow — drifts on scroll */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          style={{ y: glowY, scale: glowScale }}
          className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(59,130,246,0.06)_0%,transparent_70%)]"
        />
        {/* Secondary warm glow */}
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0, 1], [-20, 30]) }}
          className="absolute left-1/3 top-1/3 h-[400px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(139,92,246,0.04)_0%,transparent_70%)]"
        />
      </div>

      {/* Atmospheric image */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
        <Image
          src="/images/book-magic-letters.webp"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--surface)] via-[var(--surface)]/60 to-[var(--surface)]" />
      </div>

      <div ref={ref} className="relative mx-auto max-w-3xl px-6 md:px-8">
        {/* Decorative top line — expands from center */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={inView ? { scaleX: 1, opacity: 1 } : {}}
          transition={spring}
          className="mx-auto mb-20 h-px w-32 origin-center bg-gradient-to-r from-transparent via-accent/40 to-transparent"
        />

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ ...spring, delay: 0.05 }}
          className="mb-6 font-mono text-[11px] uppercase tracking-[0.2em] text-accent/40"
        >
          Try it now
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <h2 className="text-glow headline-glow font-display text-display-lg font-bold leading-[0.9] tracking-tighter">
            <span className="text-white">Your manuscript has been</span>
            <br />
            <span className="gradient-hero-text">
              waiting for this.
            </span>
          </h2>

          <p className="mx-auto mt-8 max-w-xl text-xl leading-relaxed text-white/30 md:text-2xl">
            Open the editor. Paste your text.
            <br className="hidden sm:block" />
            See what professional typesetting actually looks like.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...spring, delay: 0.5 }}
            className="mt-14 flex flex-col items-center gap-6"
          >
            <Link
              href="/app"
              className="group relative inline-flex h-14 items-center gap-3 rounded-full bg-white px-10 text-[17px] font-semibold text-[#030305] shadow-cta transition-all duration-300 hover:scale-[1.03] hover:shadow-cta-hover"
            >
              <span className="pointer-events-none absolute inset-0 -z-10 animate-glow-breathe rounded-full bg-white/20 blur-xl" />
              Open the Editor — Free
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>

            <p className="font-mono text-[13px] text-white/15">
              No account required &middot; Works in any browser
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
