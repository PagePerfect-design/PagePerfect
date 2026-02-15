'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6">
      {/* Single ambient glow — restrained, not a light show */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.06)_0%,transparent_70%)]" />
      </div>

      {/* ===== CONTENT ===== */}
      <div className="relative z-10 flex max-w-5xl flex-col items-center text-center">

        {/* Status pill — minimal glass */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 inline-flex items-center gap-2.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-5 py-2 backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-mono text-xs tracking-wide text-white/40">
            Free to use — no account needed
          </span>
        </motion.div>

        {/* Headline — massive, Swiss-tight, staggered unblur */}
        <h1 className="font-display text-hero font-bold leading-[0.88] tracking-tightest">
          <motion.span
            initial={{ opacity: 0, filter: 'blur(12px)', y: 8 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
            className="block text-white"
          >
            Paste text.
          </motion.span>
          <motion.span
            initial={{ opacity: 0, filter: 'blur(12px)', y: 8 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
            className="gradient-hero-text block pb-3"
          >
            Get a book.
          </motion.span>
        </h1>

        {/* Subhead — wider column, body font */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55, ease: [0.25, 0.4, 0.25, 1] }}
          className="mx-auto mt-8 max-w-2xl font-body text-xl font-light leading-relaxed text-white/40 md:text-[1.4rem] md:leading-[1.7]"
        >
          Turn plain text into professionally typeset, print-ready PDFs.
          <br className="hidden md:block" />
          In your browser. In seconds.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75, ease: [0.25, 0.4, 0.25, 1] }}
          className="mt-14 flex flex-col items-center gap-8 sm:flex-row"
        >
          {/* Primary CTA — white button with breathing glow */}
          <Link
            href="/app"
            className="group relative inline-flex h-14 items-center gap-3 rounded-full bg-white px-9 text-[17px] font-semibold text-[#030305] shadow-cta transition-all duration-300 hover:scale-[1.03] hover:shadow-cta-hover"
          >
            <span className="pointer-events-none absolute inset-0 -z-10 animate-glow-breathe rounded-full bg-white/20 blur-xl" />
            <span>Open the Editor</span>
            <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>

          {/* Secondary CTA */}
          <Link
            href="#how-it-works"
            className="group flex items-center gap-2 text-sm font-medium text-white/40 transition-all duration-300 hover:text-white"
          >
            <span className="border-b border-white/20 pb-0.5 transition-colors group-hover:border-white/50">
              See how it works
            </span>
            <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </Link>
        </motion.div>

        {/* Platform line — ultra-subtle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="mt-16 font-mono text-[13px] text-white/15"
        >
          Works with Amazon KDP &middot; IngramSpark &middot; Lulu &middot; Any browser
        </motion.p>
      </div>

      {/* Scroll indicator — minimal breathing line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        >
          <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-white/5" />
        </motion.div>
      </motion.div>
    </section>
  )
}
