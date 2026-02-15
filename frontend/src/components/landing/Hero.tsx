'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 pt-16 text-center">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.07] blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] h-[300px] w-[300px] rounded-full bg-violet-500/[0.04] blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
        className="relative z-10 max-w-5xl"
      >
        {/* Status pill */}
        <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          <span className="font-mono text-xs text-accent">Free to use — no account needed</span>
        </span>

        <h1 className="font-display text-hero font-bold leading-[0.95] tracking-[-0.04em] text-text-primary">
          Paste text.
          <br />
          <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            Get a book.
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-xl font-light leading-relaxed text-text-secondary md:text-2xl">
          PagePerfect turns plain text into professionally typeset,
          print-ready PDFs — in your browser, in seconds.
        </p>

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/app"
            className="group inline-flex h-14 items-center gap-3 rounded-full bg-white px-8 text-lg font-semibold text-surface transition-all duration-200 hover:scale-[1.03] hover:shadow-glow-white"
          >
            Open the Editor
            <svg
              className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <p className="mt-8 font-mono text-sm text-text-ghost">
          No install. No design skills. Works with KDP, IngramSpark, and Lulu.
        </p>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.svg
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="h-6 w-6 text-text-ghost"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </motion.svg>
      </motion.div>
    </section>
  )
}
