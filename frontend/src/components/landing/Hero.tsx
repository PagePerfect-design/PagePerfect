'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 pt-16 text-center">
      {/* Layered background: dot grid + multi-color ambient glows */}
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-60" />
      <div className="pointer-events-none absolute inset-0">
        {/* Primary blue glow — top center */}
        <div className="absolute left-1/2 top-[20%] h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(79,143,255,0.12)_0%,transparent_70%)]" />
        {/* Secondary violet glow — bottom right */}
        <div className="absolute bottom-[5%] right-[5%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(ellipse,rgba(139,92,246,0.08)_0%,transparent_70%)]" />
        {/* Warm accent — bottom left */}
        <div className="absolute bottom-[15%] left-[10%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(ellipse,rgba(59,130,246,0.06)_0%,transparent_70%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.25, 0.4, 0.25, 1] }}
        className="relative z-10 max-w-5xl"
      >
        {/* Status pill with glass effect */}
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-10 inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-5 py-2 backdrop-blur-md"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <span className="font-mono text-xs tracking-wide text-white/70">Free to use — no account needed</span>
        </motion.span>

        <h1 className="font-display text-hero font-bold leading-[0.92] tracking-[-0.04em]">
          <span className="text-white">Paste text.</span>
          <br />
          <span className="bg-gradient-to-b from-white via-white/80 to-white/20 bg-clip-text text-transparent">
            Get a book.
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mx-auto mt-8 max-w-2xl font-body text-xl leading-relaxed text-white/50 md:text-2xl"
        >
          Turn plain text into professionally typeset, print-ready PDFs.
          In your browser. In seconds.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-14 flex flex-col items-center gap-5 sm:flex-row sm:justify-center"
        >
          <Link
            href="/app"
            className="group inline-flex h-14 items-center gap-3 rounded-full bg-white px-9 text-[17px] font-semibold text-[#0a0a0f] shadow-[0_0_50px_-12px_rgba(255,255,255,0.25)] transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_0_60px_-8px_rgba(255,255,255,0.35)]"
          >
            Open the Editor
            <svg
              className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex h-14 items-center gap-2 rounded-full border border-white/[0.08] px-8 text-[15px] font-medium text-white/60 transition-all duration-300 hover:border-white/[0.15] hover:text-white/80"
          >
            See how it works
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-10 font-mono text-[13px] text-white/25"
        >
          Works with Amazon KDP &middot; IngramSpark &middot; Lulu &middot; Any browser
        </motion.p>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2"
        >
          <div className="h-8 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-white/5" />
        </motion.div>
      </motion.div>
    </section>
  )
}
