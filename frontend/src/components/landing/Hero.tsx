'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRef } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'

// LAW 1: Spring physics — no linear fades
const spring = { type: 'spring' as const, stiffness: 100, damping: 20 }

// Stagger-reveal each character
function StaggerText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={className} aria-label={text}>
      {text.split('').map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            ...spring,
            delay: delay + i * 0.03,
          }}
          className="inline-block"
          style={{ whiteSpace: char === ' ' ? 'pre' : undefined }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  )
}

// 3D CSS Book — spine, cover, pages — no image files
function CSSBook() {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const rotateY = useSpring(
    useTransform(mouseX, [0, 1], [-30, -15]),
    { stiffness: 60, damping: 20 }
  )
  const rotateX = useSpring(
    useTransform(mouseY, [0, 1], [10, -5]),
    { stiffness: 60, damping: 20 }
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...spring, delay: 1.2 }}
      className="relative mx-auto"
      style={{ perspective: 1200 }}
    >
      <motion.div
        style={{
          rotateY,
          rotateX,
          transformStyle: 'preserve-3d',
        }}
        className="relative h-[320px] w-[220px] md:h-[400px] md:w-[280px]"
      >
        {/* Book cover — front face */}
        <div
          className="absolute inset-0 rounded-r-md rounded-l-sm border border-white/[0.08] bg-gradient-to-br from-[#0f1628] via-[#0a0f1e] to-[#06080f]"
          style={{
            transform: 'translateZ(12px)',
            boxShadow: '0 20px 60px -15px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Cover content */}
          <div className="flex h-full flex-col justify-between p-8 md:p-10">
            {/* Top decoration */}
            <div>
              <div className="mb-6 h-[1px] w-16 bg-gradient-to-r from-accent/60 to-transparent" />
              <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/20">
                A Novel
              </div>
            </div>

            {/* Title area */}
            <div>
              <h3
                className="font-display text-2xl font-bold leading-[0.9] tracking-tighter text-white/90 md:text-3xl"
              >
                The Art of
                <br />
                <span className="gradient-accent-text">Typography</span>
              </h3>
              <div className="mt-4 h-[1px] w-full bg-gradient-to-r from-white/10 to-transparent" />
              <p className="mt-3 font-display text-[11px] tracking-widest text-white/25">
                Jane Doe
              </p>
            </div>

            {/* Bottom branding */}
            <div className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/10">
              PagePerfect
            </div>
          </div>
        </div>

        {/* Spine — left edge */}
        <div
          className="absolute left-0 top-0 h-full w-6 rounded-l-sm bg-gradient-to-r from-[#080c18] to-[#0a1020]"
          style={{
            transform: 'translateX(-12px) rotateY(90deg)',
            transformOrigin: 'right center',
          }}
        >
          <div className="flex h-full items-center justify-center">
            <span
              className="font-display text-[8px] font-bold uppercase tracking-[0.3em] text-white/20"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              PagePerfect
            </span>
          </div>
        </div>

        {/* Page edges — visible from the side */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute inset-y-1 right-0 left-1 rounded-r-[1px] bg-[#e8e5df]"
            style={{
              transform: `translateZ(${10 - i * 2}px)`,
              opacity: 0.15 + i * 0.05,
            }}
          />
        ))}

        {/* Back cover */}
        <div
          className="absolute inset-0 rounded-r-md rounded-l-sm bg-[#06080f]"
          style={{ transform: 'translateZ(-2px)' }}
        />

        {/* Ground shadow */}
        <div
          className="pointer-events-none absolute -bottom-8 left-4 right-4 h-10 rounded-[50%] bg-accent/20 blur-2xl"
          style={{ transform: 'translateZ(-10px)' }}
        />
      </motion.div>
    </motion.div>
  )
}

export function Hero() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6">
      {/* LAW 2: Radial gradient glow — light bleed behind the void */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[20%] h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.07)_0%,transparent_60%)]" />
        <div className="absolute left-[30%] top-[60%] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.04)_0%,transparent_60%)]" />
      </div>

      {/* Atmospheric hero image — faded into the void */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
        <Image
          src="/images/bookshelf-panorama.webp"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-void via-void/80 to-void" />
      </div>

      {/* CENTER STAGE */}
      <div className="relative z-10 flex max-w-6xl flex-col items-center text-center">

        {/* Status pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={spring}
          className="mb-12 inline-flex items-center gap-2.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-5 py-2 backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-mono text-xs tracking-wide text-white/30">
            Free to use &mdash; no account needed
          </span>
        </motion.div>

        {/* THE HEADLINE — LAW 3: Typography IS the image */}
        <h1 className="text-glow headline-glow font-display text-hero font-bold leading-[0.9] tracking-tighter">
          {/* Line 1 */}
          <span className="block text-white">
            <StaggerText text="Paste Text." delay={0.15} />
          </span>
          {/* Line 2 — metallic gradient */}
          <span className="block gradient-metallic-text pb-3">
            <StaggerText text="Get a Book." delay={0.55} />
          </span>
        </h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 1.0 }}
          className="mx-auto mt-10 max-w-xl font-body text-xl font-light leading-relaxed text-white/35 md:text-[1.35rem] md:leading-[1.8]"
        >
          Turn plain text into professionally typeset, print-ready PDFs.
          <br className="hidden md:block" />
          In your browser. In seconds.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 1.15 }}
          className="mt-16 flex flex-col items-center gap-8 sm:flex-row"
        >
          <Link
            href="/app"
            className="group glass-pill inline-flex h-14 items-center gap-3 px-9 text-[17px] font-semibold text-white"
          >
            <span>Open Editor</span>
            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <Link
            href="#how-it-works"
            className="group flex items-center gap-2 text-sm font-medium text-white/30 transition-all duration-300 hover:text-white"
          >
            <span className="border-b border-white/15 pb-0.5 transition-colors group-hover:border-white/40">
              See how it works
            </span>
            <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5" />
          </Link>
        </motion.div>

        {/* 3D CSS Book — LAW 1: it floats, it has mass */}
        <div className="mt-20 md:mt-24">
          <CSSBook />
        </div>

        {/* Platform line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="mt-16 font-mono text-[13px] text-white/10"
        >
          Amazon KDP &middot; IngramSpark &middot; Lulu &middot; Any browser
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        >
          <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-white/15 to-white/5" />
        </motion.div>
      </motion.div>
    </section>
  )
}
