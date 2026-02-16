'use client'

import { Fragment, useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'

const ease = [0.25, 0.4, 0.25, 1] as const

const STEPS = [
  {
    num: '01',
    title: 'Paste your manuscript',
    body: 'Drop in Markdown or paste from Word. YAML frontmatter sets title, author, and metadata. Smart quotes, em-dashes, and encoding artifacts are cleaned automatically.',
    detail: 'Real-time preview updates as you type. No export steps, no file converters.',
  },
  {
    num: '02',
    title: 'Pick your design system',
    body: 'Eight typographic systems — from academic Chicago to experimental Avantgarde. Each uses Muller-Brockmann grid principles with calculated baselines and golden-ratio heading scales.',
    detail: 'Not themes — mathematical typographic systems where every line locks to a baseline grid.',
  },
  {
    num: '03',
    title: 'Export print-ready PDF',
    body: 'Professional output with embedded fonts, correct bleed, and proper trim. Upload directly to Amazon KDP, IngramSpark, Lulu, or any print-on-demand service.',
    detail: 'Compiles in seconds via XeLaTeX. Download, upload to your distributor — done.',
  },
]

function StepRow({ step, index }: { step: typeof STEPS[number]; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1, ease }}
      className="group"
    >
      <div className="grid grid-cols-1 gap-4 py-12 md:grid-cols-[6rem_1fr_1fr] md:items-baseline md:gap-12 md:py-16">
        {/* Step number — large, ghosted */}
        <span className="font-display text-[4rem] font-extrabold leading-none tracking-tighter text-white/[0.08] transition-colors duration-500 group-hover:text-[#0033ff]/[0.15] md:text-[5rem]">
          {step.num}
        </span>

        {/* Title + body — serif body */}
        <div>
          <h3 className="font-display text-xl font-bold leading-[1.1] tracking-tight text-white md:text-2xl lg:text-[1.75rem]">
            {step.title}
          </h3>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-white/55 md:text-base">
            {step.body}
          </p>
        </div>

        {/* Detail — italic aside */}
        <p className="border-l border-white/[0.08] pl-6 font-body text-[14px] leading-relaxed text-white/40 italic md:text-[15px]">
          {step.detail}
        </p>
      </div>
    </motion.div>
  )
}

export function HowItWorks() {
  const headerRef = useRef(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })

  return (
    <section id="how-it-works" className="relative py-32 md:py-44 overflow-hidden">
      {/* Background image — scattered open books */}
      <div className="absolute inset-0">
        <Image
          src="/images/books-scattered.webp"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          style={{ filter: 'grayscale(40%) brightness(0.15)' }}
        />
        <div className="absolute inset-0 bg-[#050505]/80" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 md:px-8">

        {/* ── HEADER — editorial, left-aligned ── */}
        <div ref={headerRef} className="mb-16 max-w-2xl md:mb-20">
          <motion.p
            initial={{ opacity: 0 }}
            animate={headerInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, ease }}
            className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40"
          >
            Process
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="font-display text-display-lg font-extrabold leading-[0.9] tracking-tighter text-white"
          >
            Three steps.
            <br />
            That&apos;s it.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="mt-6 font-body text-lg leading-relaxed text-white/50"
          >
            From raw manuscript to print-ready PDF in under a minute.
          </motion.p>
        </div>

        {/* ── STEPS ── */}
        <div>
          {STEPS.map((step, i) => (
            <Fragment key={step.num}>
              <div className="h-px bg-white/[0.06]" />
              <StepRow step={step} index={i} />
            </Fragment>
          ))}
          <div className="h-px bg-white/[0.06]" />
        </div>
      </div>
    </section>
  )
}
