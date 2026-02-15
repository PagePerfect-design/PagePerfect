'use client'

import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import { useRef } from 'react'

// LAW 1: Spring physics
const spring = { type: 'spring' as const, stiffness: 100, damping: 20 }

const STEPS = [
  {
    num: '01',
    title: 'Paste your manuscript',
    desc: 'Drop in Markdown, paste from Word, or upload a .docx. We auto-clean smart quotes, dashes, and formatting artifacts.',
  },
  {
    num: '02',
    title: 'Choose a template',
    desc: 'Eight professional designs with calculated baselines, golden-ratio heading scales, and optimized margins. Not a theme. A system.',
  },
  {
    num: '03',
    title: 'Download your book',
    desc: 'Print-ready PDF in seconds. Compatible with Amazon KDP, IngramSpark, Lulu, and every print-on-demand service.',
  },
]

function Step({ step, index }: { step: typeof STEPS[number]; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ ...spring, delay: index * 0.15 }}
      className="group relative"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-white/[0.06] transition-all duration-500 group-hover:bg-gradient-to-r group-hover:from-transparent group-hover:via-accent/50 group-hover:to-transparent" />

      <div className="py-16 md:py-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-16 lg:gap-24">
          <span className="font-display text-step font-bold leading-none tracking-tighter bg-gradient-to-b from-white/[0.12] to-white/[0.03] bg-clip-text text-transparent transition-all duration-500 group-hover:from-accent/60 group-hover:to-accent/10">
            {step.num}
          </span>
          <div className="flex-1">
            <h3 className="font-display text-2xl font-bold leading-[0.9] tracking-tighter text-white md:text-3xl lg:text-[2.5rem]">
              {step.title}
            </h3>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/35 md:text-xl">
              {step.desc}
            </p>
          </div>
          <div className="hidden items-center md:flex">
            <svg
              className="h-6 w-6 text-white/[0.06] transition-all duration-500 group-hover:text-accent/40 group-hover:translate-x-1"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section-separator relative bg-surface py-32 md:py-44">
      {/* Dot grid */}
      <div className="pointer-events-none absolute inset-0 bg-dot-grid-subtle" />

      {/* Atmospheric image — book tunnel behind steps */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <Image
          src="/images/book-tunnel.webp"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface via-surface/80 to-surface" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 md:px-8">
        <div className="mb-20 text-center md:mb-28">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-accent/50">How it works</div>
          <h2 className="text-glow headline-glow font-display text-display-lg font-bold leading-[0.9] tracking-tighter text-white">
            Three steps. That&apos;s it.
          </h2>
        </div>

        <div>
          {STEPS.map((step, i) => (
            <Step key={step.num} step={step} index={i} />
          ))}
          <div className="h-px bg-white/[0.06]" />
        </div>
      </div>
    </section>
  )
}
