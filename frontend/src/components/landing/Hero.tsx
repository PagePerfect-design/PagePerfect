'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

/* ---------- CSS book page mock ---------- */
function BookPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 1.0, duration: 1.2, ease: [0.25, 0.4, 0.25, 1] }}
      className="relative mx-auto mt-20 w-full max-w-[380px] md:max-w-[440px]"
      style={{ perspective: '1200px' }}
    >
      {/* Page glow — light bleeding from the white page */}
      <div className="absolute -inset-12 rounded-3xl bg-[radial-gradient(ellipse,rgba(255,255,255,0.08)_0%,transparent_70%)]" />
      <div className="absolute -inset-24 rounded-full bg-[radial-gradient(ellipse,rgba(59,130,246,0.06)_0%,transparent_70%)]" />

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
        className="relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Shadow beneath the page */}
        <div className="absolute -bottom-4 left-4 right-4 h-8 rounded-full bg-black/50 blur-xl" />

        {/* The page itself */}
        <div
          className="relative overflow-hidden rounded-sm border border-white/[0.08] bg-[#fafaf8] px-10 py-12 md:px-14 md:py-16"
          style={{
            boxShadow:
              '0 25px 60px -15px rgba(0,0,0,0.6), 0 0 120px -30px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          {/* Subtle paper texture grain */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Chapter heading */}
          <div className="mb-6 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-neutral-400">
              Chapter One
            </p>
            <h3
              className="mt-2 font-serif text-[22px] font-normal tracking-wide text-neutral-800 md:text-[26px]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              The Beginning
            </h3>
            {/* Decorative rule */}
            <div className="mx-auto mt-3 h-px w-16 bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
          </div>

          {/* Body text with drop cap */}
          <div className="relative text-[11px] leading-[1.85] text-neutral-600 md:text-[12px]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {/* Drop cap */}
            <span
              className="float-left mr-2 mt-[2px] font-serif text-[42px] font-normal leading-[0.8] text-neutral-800 md:text-[48px]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              I
            </span>
            t was a truth universally acknowledged that a manuscript in want
            of good typesetting must be in want of PagePerfect. The old methods
            had failed them — word processors with their crude approximations
            of the typographic arts, their rivers of white space and widowed
            lines scattered across pages like afterthoughts.

            <p className="mt-3">
              But here, in the quiet precision of a properly set page, the words
              found their natural rhythm. Each baseline aligned. Each margin
              calculated to the golden ratio. The text breathed.
            </p>
          </div>

          {/* Page number */}
          <div className="mt-8 text-center font-mono text-[9px] text-neutral-300">
            7
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ---------- Main Hero ---------- */
export function Hero() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-24 md:pb-28">
      {/* ===== ATMOSPHERIC BACKGROUND ===== */}

      {/* God-Tier Dot Grid — fades to void via mask-image */}
      <div className="pointer-events-none absolute inset-0 bg-dot-grid" />

      {/* Primary glow — massive, bright, unmistakable light source */}
      <div className="pointer-events-none absolute inset-0">
        {/* Central blue — the main light */}
        <div className="absolute left-1/2 top-[18%] h-[800px] w-[1000px] -translate-x-1/2 bg-glow-radial" />
        {/* Violet accent — upper right */}
        <div className="absolute right-[5%] top-[8%] h-[600px] w-[600px] bg-glow-radial-violet" />
        {/* Deep blue — lower left */}
        <div className="absolute bottom-[10%] left-[5%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.12)_0%,transparent_70%)]" />
        {/* Violet bloom — bottom center (page glow zone) */}
        <div className="absolute bottom-[5%] left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(168,85,247,0.08)_0%,transparent_70%)]" />
      </div>

      {/* Animated aurora sweep — breathing light */}
      <motion.div
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        className="pointer-events-none absolute left-1/2 top-[12%] h-[700px] w-[1400px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(59,130,246,0.1)_0%,rgba(168,85,247,0.05)_40%,transparent_70%)]"
      />

      {/* ===== CONTENT ===== */}
      <div className="relative z-10 flex max-w-5xl flex-col items-center text-center">

        {/* Status pill — glassmorphism with pinging dot */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-surface-glass px-5 py-2 text-sm text-gray-300 shadow-glass backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <span className="font-mono text-xs tracking-wide">
            Free to use — no account needed
          </span>
        </motion.div>

        {/* Headline — Swiss-tight, staggered unblur */}
        <h1 className="font-display text-hero font-bold leading-[0.9] tracking-tightest">
          <motion.span
            initial={{ opacity: 0, filter: 'blur(12px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="block text-white"
          >
            Paste text.
          </motion.span>
          <motion.span
            initial={{ opacity: 0, filter: 'blur(12px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="block bg-gradient-accent bg-clip-text pb-2 text-transparent"
          >
            Get a book.
          </motion.span>
        </h1>

        {/* Subhead — lighter weight, breathable */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="mx-auto mt-8 max-w-2xl font-body text-xl font-light leading-relaxed text-gray-400 md:text-2xl"
        >
          Turn plain text into professionally typeset, print-ready PDFs.
          <br className="hidden md:block" />
          In your browser. In seconds.
        </motion.p>

        {/* CTA buttons — glow button + uppercase link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.75 }}
          className="mt-12 flex flex-col items-center gap-6 sm:flex-row"
        >
          <Link
            href="/app"
            className="group relative inline-flex h-14 items-center gap-3 rounded-full bg-white px-9 text-[17px] font-semibold text-[#030305] transition-all duration-300 hover:scale-105 hover:shadow-glow-blue"
          >
            <span>Open the Editor</span>
            <svg
              className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>

          <Link
            href="#how-it-works"
            className="border-b border-transparent pb-0.5 text-sm font-medium uppercase tracking-wide text-gray-400 transition-colors hover:border-gray-500 hover:text-white"
          >
            See how it works
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mt-10 font-mono text-[13px] text-white/20"
        >
          Works with Amazon KDP &middot; IngramSpark &middot; Lulu &middot; Any browser
        </motion.p>
      </div>

      {/* ===== FLOATING BOOK PAGE ===== */}
      <BookPage />

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2"
        >
          <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-white/5" />
        </motion.div>
      </motion.div>
    </section>
  )
}
