'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'

// LAW 1: Spring physics everywhere — no linear fades
const spring = { type: 'spring' as const, stiffness: 100, damping: 20 }

// ─────────────────────────────────────────────────────
// STAGGER TEXT — character reveal, fast, NO blur (blur = fog)
// Clean Y offset only. Inspired by Linear's title reveals.
// ─────────────────────────────────────────────────────
function StaggerText({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <span aria-label={text}>
      {text.split('').map((char, i) => (
        <motion.span
          key={`${i}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: delay + i * 0.025 }}
          className="inline-block"
          style={char === ' ' ? { width: '0.3em' } : undefined}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  )
}

// ─────────────────────────────────────────────────────
// FLOATING MARKDOWN FRAGMENTS
// The "input" — raw syntax orbiting the typeset page.
// Tells the transformation story visually: text → book.
// ─────────────────────────────────────────────────────
const FRAGMENTS = [
  { text: '# Heading',    x: -155, y: -120, rot: -8,  delay: 1.4, op: 0.14 },
  { text: '**bold**',     x: 125,  y: -145, rot: 11,  delay: 1.6, op: 0.11 },
  { text: '> blockquote', x: -170, y: 15,   rot: -13, delay: 1.8, op: 0.10 },
  { text: '---',          x: -135, y: 105,  rot: 4,   delay: 2.0, op: 0.16 },
  { text: '_italic_',     x: 155,  y: -30,  rot: 9,   delay: 1.7, op: 0.11 },
  { text: '## Section',   x: 140,  y: 90,   rot: -5,  delay: 1.9, op: 0.10 },
  { text: '[link]()',     x: -90,  y: 150,  rot: -2,  delay: 2.1, op: 0.12 },
  { text: '1. list',      x: 105,  y: 155,  rot: 7,   delay: 2.3, op: 0.10 },
]

// ─────────────────────────────────────────────────────
// TYPESET PAGE — the hero visual
//
// Not a screenshot. Not a closed book. The product's actual
// output: a beautifully typeset page you can read.
//
// Mouse-tracking tilt with spring physics (LAW 1).
// Blue glow emanates FROM the page — it's the light source.
// Markdown fragments orbit it — input becoming output.
// ─────────────────────────────────────────────────────
function TypesetPage() {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const rotateY = useSpring(
    useTransform(mouseX, [0, 1], [-8, 8]),
    { stiffness: 50, damping: 20 }
  )
  const rotateX = useSpring(
    useTransform(mouseY, [0, 1], [6, -6]),
    { stiffness: 50, damping: 20 }
  )

  function handleMouseMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set((e.clientX - rect.left) / rect.width)
    mouseY.set((e.clientY - rect.top) / rect.height)
  }

  function handleMouseLeave() {
    mouseX.set(0.5)
    mouseY.set(0.5)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, x: 60, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ ...spring, delay: 0.7 }}
      className="relative"
      style={{ perspective: 1200 }}
    >
      {/* Floating markdown fragments */}
      {FRAGMENTS.map((f, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{
            opacity: f.op,
            scale: 1,
            y: [0, -7, 0],
          }}
          transition={{
            opacity: { delay: f.delay, duration: 0.6 },
            scale: { delay: f.delay, duration: 0.5 },
            y: {
              delay: f.delay + 0.4,
              duration: 3.5 + i * 0.4,
              repeat: Infinity,
              repeatType: 'reverse' as const,
              ease: 'easeInOut',
            },
          }}
          className="pointer-events-none absolute whitespace-nowrap font-mono text-[11px] text-accent-glow select-none"
          style={{
            left: `calc(50% + ${f.x}px)`,
            top: `calc(50% + ${f.y}px)`,
            transform: `rotate(${f.rot}deg)`,
          }}
        >
          {f.text}
        </motion.span>
      ))}

      {/* Glow FROM the page — directed light, not ambient fog */}
      <div className="pointer-events-none absolute -inset-20 -z-10 rounded-full bg-accent/[0.06] blur-[80px]" />
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-accent/[0.03] blur-[40px]" />

      {/* The page — mouse-tracking tilt */}
      <motion.div
        style={{ rotateY, rotateX, transformStyle: 'preserve-3d' }}
        className="relative"
      >
        <div
          className="relative w-[260px] overflow-hidden bg-[#fafaf5] sm:w-[300px] md:w-[340px]"
          style={{
            padding: '11% 10%',
            boxShadow: [
              '0 30px 100px -20px rgba(59, 130, 246, 0.30)',
              '0 10px 40px -10px rgba(0, 0, 0, 0.50)',
              '0 0 0 1px rgba(255, 255, 255, 0.04)',
            ].join(', '),
          }}
        >
          {/* Chapter heading */}
          <div className="mb-4 text-center sm:mb-5">
            <p className="font-mono text-[7px] uppercase tracking-[0.35em] text-black/20 sm:text-[8px]">
              Chapter One
            </p>
            <h3
              className="mt-1 text-[15px] font-normal tracking-wide text-black/65 sm:text-[18px] md:text-[20px]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              The Beginning
            </h3>
            <div className="mx-auto mt-2 h-px w-10 bg-gradient-to-r from-transparent via-black/12 to-transparent" />
          </div>

          {/* Body text with drop cap */}
          <div
            className="text-[8.5px] leading-[1.85] text-black/40 sm:text-[9.5px] md:text-[10.5px]"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            <span
              className="float-left mr-1 mt-[1px] text-[28px] font-normal leading-[0.75] text-black/50 sm:text-[34px] md:text-[38px]"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              T
            </span>
            he morning light filtered through the old windows of the library, casting
            long shadows across the worn wooden desk where she had spent every morning
            for the past three years.

            <p className="mt-2">
              She picked up the manuscript&thinsp;&mdash;&thinsp;three hundred pages
              of her life&rsquo;s work, still unfinished, still demanding more.
              Everything about it screamed &ldquo;amateur.&rdquo;
            </p>
            <p className="mt-2">
              But today would be different. She had found something that understood
              what a real book should look like.
            </p>
          </div>

          {/* Page number */}
          <div className="mt-4 text-center font-mono text-[6px] text-black/12 sm:mt-5 md:mt-6">
            7
          </div>

          {/* Subtle page edge — right side thickness */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-black/[0.03] to-transparent" />
        </div>

        {/* Ground shadow — anchors page to 3D space */}
        <div className="pointer-events-none absolute -bottom-5 left-6 right-6 h-6 rounded-[50%] bg-black/25 blur-xl" />
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────
// HERO SECTION
//
// Layout: Asymmetric two-column on lg+.
//   Left  — headline, subline, CTA (left-aligned = confident)
//   Right — floating typeset page with markdown fragments
//
// Mobile: centered single-column, page below CTAs.
//
// FIXES vs previous version:
//   1. "Get a book." now uses gradient-hero-text (vivid, not invisible)
//   2. No text-glow, no headline-glow (no fog machine)
//   3. Asymmetric layout (not generic centered SaaS)
//   4. Visual is IN the viewport, not 800px below
//   5. Solid white CTA button (not invisible glass pill)
// ─────────────────────────────────────────────────────
export function Hero() {
  return (
    <section className="relative flex min-h-[100dvh] items-center overflow-hidden">
      {/* Background: subtle dot grid texture */}
      <div className="pointer-events-none absolute inset-0 bg-dot-grid-subtle opacity-30" />

      {/* Background: single radial glow — shifted right toward the page */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[5%] top-[25%] h-[900px] w-[900px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.05)_0%,transparent_60%)] lg:right-[15%]" />
      </div>

      {/* Background: atmospheric bookshelf — barely there */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <Image
          src="/images/bookshelf-panorama.webp"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-void via-void/80 to-void/60" />
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 md:px-8 md:py-0">
        <div className="grid items-center gap-16 lg:grid-cols-[1fr_auto] lg:gap-20 xl:gap-28">

          {/* ─── LEFT: The Message ─── */}
          <div className="max-w-2xl text-center lg:text-left">

            {/* Tag — product-focused, minimal */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.05 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 lg:mb-10"
            >
              <span className="font-mono text-[11px] tracking-wide text-white/25">
                Markdown → print-ready PDF
              </span>
            </motion.div>

            {/* THE HEADLINE — clean, no glow, no fog */}
            <h1 className="font-display text-[clamp(3.2rem,9vw,7.5rem)] font-bold leading-[0.88] tracking-tighter">
              <span className="block text-white">
                <StaggerText text="Paste text." delay={0.15} />
              </span>
              <span className="block gradient-hero-text mt-2">
                <StaggerText text="Get a book." delay={0.45} />
              </span>
            </h1>

            {/* Subline — one line, confident */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.85 }}
              className="mt-7 max-w-md text-lg text-white/35 lg:text-xl"
            >
              Professional typesetting in your browser. Free, no account.
            </motion.p>

            {/* CTAs — solid white primary (visible!), text secondary */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 1.0 }}
              className="mt-10 flex flex-col items-center gap-5 sm:flex-row lg:items-start"
            >
              <Link
                href="/app"
                className="group inline-flex h-14 items-center gap-3 rounded-full bg-white px-10 text-[17px] font-semibold text-void shadow-cta transition-all duration-300 hover:scale-[1.02] hover:shadow-cta-hover"
              >
                Open Editor
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>

              <Link
                href="/pricing"
                className="inline-flex h-14 items-center text-[15px] text-white/25 transition-colors duration-200 hover:text-white/50"
              >
                View pricing →
              </Link>
            </motion.div>

            {/* Platform line */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.5 }}
              className="mt-12 font-mono text-[11px] text-white/[0.08]"
            >
              Amazon KDP · IngramSpark · Lulu · Any browser
            </motion.p>
          </div>

          {/* ─── RIGHT: The Visual ─── */}
          <div className="flex justify-center lg:justify-end">
            <TypesetPage />
          </div>
        </div>
      </div>
    </section>
  )
}
