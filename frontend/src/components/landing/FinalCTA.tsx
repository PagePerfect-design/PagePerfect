'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export function FinalCTA() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="relative overflow-hidden py-32 text-center md:py-44">
      {/* Subtle ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(59,130,246,0.08)_0%,transparent_70%)]" />
      </div>

      <div ref={ref} className="relative mx-auto max-w-3xl px-6 md:px-8">
        {/* Decorative top line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="mx-auto mb-20 h-px w-32 origin-center bg-gradient-to-r from-transparent via-accent/40 to-transparent"
        />

        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.4, 0.25, 1] }}
        >
          <h2 className="font-display text-display-lg font-bold tracking-tighter">
            <span className="text-white">Your manuscript has been</span>
            <br />
            <span className="gradient-hero-text">
              waiting for this.
            </span>
          </h2>

          <p className="mx-auto mt-8 max-w-xl text-xl leading-relaxed text-white/35 md:text-2xl">
            Open the editor. Paste your text.
            See what professional typesetting actually looks like.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-14 flex flex-col items-center gap-6"
          >
            <Link
              href="/app"
              className="group relative inline-flex h-14 items-center gap-3 rounded-full bg-white px-10 text-[17px] font-semibold text-[#030305] shadow-cta transition-all duration-300 hover:scale-[1.03] hover:shadow-cta-hover"
            >
              {/* Breathing glow */}
              <span className="pointer-events-none absolute inset-0 -z-10 animate-glow-breathe rounded-full bg-white/20 blur-xl" />
              Open the Editor — Free
              <svg
                className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
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
