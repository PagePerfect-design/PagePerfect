'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export function FinalCTA() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="relative overflow-hidden py-32 text-center md:py-44">
      {/* Background image — book tunnel, moody atmosphere */}
      <div className="absolute inset-0">
        <Image
          src="/images/book-tunnel.webp"
          alt=""
          fill
          className="object-cover opacity-[0.08]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/70 to-surface/90" />
      </div>

      {/* Multi-layer ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(59,130,246,0.1)_0%,transparent_70%)]" />
        <div className="absolute left-[20%] top-[30%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(ellipse,rgba(168,85,247,0.06)_0%,transparent_70%)]" />
        <div className="absolute right-[20%] bottom-[20%] h-[350px] w-[350px] rounded-full bg-[radial-gradient(ellipse,rgba(59,130,246,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-30" />

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
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              waiting for this.
            </span>
          </h2>

          <p className="mx-auto mt-8 max-w-xl text-xl leading-relaxed text-white/40 md:text-2xl">
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
              className="group inline-flex h-14 items-center gap-3 rounded-full bg-white px-10 text-[17px] font-semibold text-[#030305] shadow-[0_0_60px_-12px_rgba(255,255,255,0.3)] transition-all duration-300 hover:scale-[1.04] hover:shadow-glow-blue"
            >
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

            <p className="font-mono text-[13px] text-white/20">
              No account required &middot; Works in any browser
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
