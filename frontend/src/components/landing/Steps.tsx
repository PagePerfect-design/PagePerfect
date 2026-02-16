'use client'

import { Fragment, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Image from 'next/image'

// ── Animation tokens (match Hero / Comparison) ─────────────────────
const spring = { type: 'spring' as const, stiffness: 100, damping: 20 }
const ease = [0.25, 0.4, 0.25, 1] as const

// ── Step data ──────────────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    title: 'Paste your manuscript',
    desc: 'Drop in Markdown or paste from Word. YAML frontmatter sets title, author, and metadata. Smart quotes, em-dashes, and encoding artifacts are cleaned automatically.',
    tags: ['Markdown', '.docx paste', 'YAML frontmatter', 'Auto-format'],
    detail: 'Real-time preview updates as you type. No export steps, no file converters — just paste and write.',
  },
  {
    num: '02',
    title: 'Pick your design system',
    desc: 'Eight typographic systems — from academic Chicago to experimental Avantgarde. Each uses Müller-Brockmann grid principles with calculated baselines and golden-ratio heading scales.',
    tags: ['8 templates', 'Baseline grid', 'Golden ratio', '7 margin presets', '11 page sizes'],
    detail: 'Not themes — mathematical typographic systems where every line locks to a baseline grid.',
  },
  {
    num: '03',
    title: 'Export print-ready PDF',
    desc: 'Professional output with embedded fonts, correct bleed, and proper trim. Upload directly to Amazon KDP, IngramSpark, Lulu, or any print-on-demand service.',
    tags: ['Embedded fonts', 'Correct bleed', 'Citations & bib', 'KDP · Ingram · Lulu'],
    detail: 'Compiles in seconds via XeLaTeX. Download, upload to your distributor — done.',
  },
]

// ── Visual Mocks ───────────────────────────────────────────────────

/* Step 1: Markdown editor with syntax highlighting */
function EditorVisual() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0a12] shadow-elevated">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
          <div className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
          <div className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
        </div>
        <div className="ml-3 flex items-center gap-2">
          <svg className="h-3 w-3 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
            <polyline points="13,2 13,9 20,9" />
          </svg>
          <span className="font-mono text-[10px] text-white/25">manuscript.md</span>
        </div>
      </div>

      {/* Code area with line gutter */}
      <div className="relative flex-1 overflow-hidden p-4">
        {/* Line numbers */}
        <div className="absolute left-0 top-5 flex flex-col items-end gap-[7px] pr-2 font-mono text-[10px] text-white/[0.08]" style={{ width: 40 }}>
          {Array.from({ length: 13 }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Syntax-highlighted markdown */}
        <div className="ml-8 space-y-[7px] font-mono text-[12px] leading-[1.6]">
          <div><span className="text-purple-400/60">---</span></div>
          <div>
            <span className="text-accent/50">title</span>
            <span className="text-white/20">: </span>
            <span className="text-emerald-400/50">&quot;The Glass Garden&quot;</span>
          </div>
          <div>
            <span className="text-accent/50">author</span>
            <span className="text-white/20">: </span>
            <span className="text-emerald-400/50">&quot;Elena Marsh&quot;</span>
          </div>
          <div><span className="text-purple-400/60">---</span></div>
          <div className="h-[7px]" />
          <div>
            <span className="text-accent/70 font-semibold"># </span>
            <span className="font-semibold text-white/70">Chapter One</span>
          </div>
          <div className="h-[7px]" />
          <div className="text-white/30">The morning light filtered through the</div>
          <div className="text-white/30">curtains, casting long shadows across</div>
          <div className="text-white/30">the hardwood floor.</div>
          <div className="h-[7px]" />
          <div className="text-white/30">
            <span className="text-amber-400/40">&ldquo;</span>Good morning,<span className="text-amber-400/40">&rdquo;</span> she said
            <span className="text-accent/40"> &mdash;</span> not quite
          </div>
          <div className="text-white/30">believing it herself.</div>
        </div>

        {/* Auto-format badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-success/20 bg-success/[0.06] px-2.5 py-1">
          <svg className="h-3 w-3 text-success/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="20,6 9,17 4,12" />
          </svg>
          <span className="font-mono text-[9px] text-success/60">Auto-formatted</span>
        </div>
      </div>
    </div>
  )
}

/* Step 2: Template selector grid */
function TemplateVisual() {
  const templates = [
    { name: 'Chicago', active: false },
    { name: 'Paperback', active: true },
    { name: 'Symphony', active: false },
    { name: 'Chronicle', active: false },
  ]

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0a12] shadow-elevated">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
        <span className="font-mono text-[10px] text-white/25">Design system</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-white/20">8 templates</span>
          <svg className="h-3 w-3 text-white/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </div>
      </div>

      {/* Template cards */}
      <div className="flex flex-1 flex-col justify-center p-4">
        <div className="grid grid-cols-4 gap-2.5">
          {templates.map((t) => (
            <div key={t.name}>
              <div
                className={`relative aspect-[3/4] overflow-hidden rounded-lg border transition-all duration-300 ${
                  t.active
                    ? 'border-accent/40 bg-accent/[0.06] shadow-glow-accent'
                    : 'border-white/[0.06] bg-white/[0.015]'
                }`}
              >
                {/* Mini page skeleton */}
                <div className="space-y-[3px] p-2.5 pt-3">
                  <div className={`h-[3px] w-3/4 rounded-full ${t.active ? 'bg-accent/25' : 'bg-white/[0.08]'}`} />
                  <div className="h-[2px] w-full rounded-full bg-white/[0.04]" />
                  <div className="h-[2px] w-full rounded-full bg-white/[0.04]" />
                  <div className="h-[2px] w-5/6 rounded-full bg-white/[0.04]" />
                  <div className="h-px" />
                  <div className="h-[2px] w-full rounded-full bg-white/[0.04]" />
                  <div className="h-[2px] w-full rounded-full bg-white/[0.04]" />
                  <div className="h-[2px] w-2/3 rounded-full bg-white/[0.04]" />
                  <div className="h-px" />
                  <div className={`h-[2.5px] w-1/2 rounded-full ${t.active ? 'bg-accent/20' : 'bg-white/[0.06]'}`} />
                  <div className="h-[2px] w-full rounded-full bg-white/[0.04]" />
                  <div className="h-[2px] w-full rounded-full bg-white/[0.04]" />
                </div>
                {t.active && <div className="absolute inset-0 rounded-lg ring-1 ring-accent/30" />}
              </div>
              <div className={`mt-1.5 text-center font-mono text-[9px] ${t.active ? 'text-accent/60' : 'text-white/20'}`}>
                {t.name}
              </div>
            </div>
          ))}
        </div>

        {/* Grid specs bar */}
        <div className="mt-4 flex items-center rounded-lg border border-white/[0.04] bg-white/[0.015] px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-4">
            {[
              { label: 'Baseline', value: '11pt' },
              { label: 'Scale', value: '1.618' },
              { label: 'Grid', value: '6 × 9 in' },
            ].map((spec) => (
              <div key={spec.label} className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-accent/40" />
                <span className="font-mono text-[9px] text-white/20">{spec.label}</span>
                <span className="font-mono text-[9px] text-white/40">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* Step 3: Export / download view */
function ExportVisual() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0a12] shadow-elevated">
      {/* Header with compiled status */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
        <span className="font-mono text-[10px] text-white/25">Export</span>
        <div className="flex items-center gap-1.5 rounded-full border border-success/20 bg-success/[0.06] px-2.5 py-0.5">
          <div className="relative h-1.5 w-1.5">
            <div className="absolute inset-0 animate-ping rounded-full bg-success/60" />
            <div className="relative h-1.5 w-1.5 rounded-full bg-success" />
          </div>
          <span className="font-mono text-[9px] text-success/70">Compiled</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center p-4">
        <div className="flex items-start gap-5">
          {/* PDF page thumbnail */}
          <div className="flex-shrink-0">
            <div className="w-24 overflow-hidden rounded-sm bg-[#fafaf5] shadow-paper">
              <div className="space-y-1 p-2.5">
                {/* Title block */}
                <div className="mb-2 text-center">
                  <div className="mx-auto h-1.5 w-10 rounded bg-gray-300" />
                  <div className="mx-auto mt-1 h-0.5 w-6 rounded bg-gray-200" />
                </div>
                {/* Body lines */}
                <div className="h-[2px] w-full rounded bg-gray-100" />
                <div className="h-[2px] w-full rounded bg-gray-100" />
                <div className="h-[2px] w-5/6 rounded bg-gray-100" />
                <div className="h-[2px] w-full rounded bg-gray-100" />
                <div className="h-[2px] w-2/3 rounded bg-gray-100" />
                <div className="h-1" />
                <div className="h-[2px] w-full rounded bg-gray-100" />
                <div className="h-[2px] w-full rounded bg-gray-100" />
                <div className="h-[2px] w-4/5 rounded bg-gray-100" />
              </div>
            </div>
            {/* File info */}
            <div className="mt-2 text-center">
              <div className="font-mono text-[9px] text-white/30">book.pdf</div>
              <div className="font-mono text-[8px] text-white/15">2.4 MB</div>
            </div>
          </div>

          {/* Spec checklist */}
          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              {[
                { label: 'Fonts', value: 'Fully embedded' },
                { label: 'Bleed', value: '0.125 in' },
                { label: 'Engine', value: 'XeLaTeX' },
                { label: 'Size', value: '6 × 9 in' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-white/25">{row.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-white/40">{row.value}</span>
                    <svg className="h-2.5 w-2.5 text-success/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Platform badges */}
            <div className="border-t border-white/[0.04] pt-3">
              <div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.15em] text-white/15">
                Compatible with
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['KDP', 'IngramSpark', 'Lulu', 'B&N'].map((p) => (
                  <div key={p} className="rounded border border-white/[0.06] bg-white/[0.02] px-2 py-0.5">
                    <span className="font-mono text-[8px] text-white/30">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const VISUALS = [EditorVisual, TemplateVisual, ExportVisual]

// ── Step Card ──────────────────────────────────────────────────────
function StepCard({ step, index }: { step: typeof STEPS[number]; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const Visual = VISUALS[index]
  const reversed = index === 1

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, filter: 'blur(6px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.8, ease }}
    >
      <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-sm transition-all duration-500 hover:border-white/[0.1] hover:bg-white/[0.025]">
        {/* Hover glow */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-accent/[0.06] blur-3xl" />
        </div>

        <div className={`relative grid grid-cols-1 lg:grid-cols-2 lg:min-h-[340px] ${reversed ? 'lg:[grid-template-columns:55%_45%]' : 'lg:[grid-template-columns:45%_55%]'}`}>
          {/* ── Text column ── */}
          <div className={`flex flex-col justify-center p-7 md:p-8 lg:p-10 ${reversed ? 'lg:order-2' : ''}`}>
            {/* Step number + title */}
            <div className="mb-3 flex items-end gap-4">
              <span className="font-display text-[3.5rem] font-bold leading-none tracking-tighter text-white/[0.07] md:text-[4.5rem]">{step.num}</span>
              <div className="mb-1.5 h-px flex-1 bg-gradient-to-r from-accent/15 to-transparent" />
            </div>

            {/* Title */}
            <h3 className="font-display text-xl font-bold leading-[1.1] tracking-tight text-white md:text-2xl lg:text-[1.75rem]">
              {step.title}
            </h3>

            {/* Description */}
            <p className="mt-3 max-w-md text-[13px] leading-relaxed text-white/40 md:text-sm">
              {step.desc}
            </p>

            {/* Feature tags */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.3, ease }}
              className="mt-4 flex flex-wrap gap-1.5"
            >
              {step.tags.map((tag, i) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ ...spring, delay: 0.4 + i * 0.06 }}
                  className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 font-mono text-[10px] text-white/35 transition-colors duration-300 group-hover:border-accent/15 group-hover:text-white/50"
                >
                  {tag}
                </motion.span>
              ))}
            </motion.div>

            {/* Supporting detail kicker */}
            <p className="mt-4 border-l-2 border-accent/20 pl-3 text-[12px] leading-relaxed text-white/25 italic">
              {step.detail}
            </p>
          </div>

          {/* ── Visual column ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, ease, delay: 0.15 }}
            className={`relative flex p-5 md:p-6 ${reversed ? 'lg:order-1' : ''}`}
          >
            <div className="flex w-full flex-col">
              <Visual />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Connector between cards ────────────────────────────────────────
function Connector() {
  return (
    <div className="flex justify-center py-1">
      <div className="flex h-10 flex-col items-center justify-center">
        <div className="h-3.5 w-px bg-gradient-to-b from-accent/10 to-accent/5" />
        <div className="h-1 w-1 rounded-full bg-accent/15" />
        <div className="h-3.5 w-px bg-gradient-to-b from-accent/5 to-transparent" />
      </div>
    </div>
  )
}

// ── Main section ───────────────────────────────────────────────────
export function HowItWorks() {
  const headerRef = useRef(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })

  return (
    <section id="how-it-works" className="section-separator relative bg-surface py-32 md:py-44">
      {/* === ATMOSPHERIC DEPTH LAYERS === */}

      {/* Layer 1: Background image */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <Image src="/images/book-tunnel.webp" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-surface via-surface/80 to-surface" />
      </div>

      {/* Layer 2: Primary glow orb */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[30%] h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(59,130,246,0.05)_0%,transparent_70%)]" />
      </div>

      {/* Layer 3: Secondary glow orb */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-[15%] left-[10%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(ellipse,rgba(168,85,247,0.035)_0%,transparent_70%)]" />
      </div>

      {/* Layer 4: Dot grid */}
      <div className="pointer-events-none absolute inset-0 bg-dot-grid-subtle" />

      {/* === CONTENT === */}
      <div className="relative mx-auto max-w-6xl px-6 md:px-8">

        {/* === SECTION HEADER === */}
        <div ref={headerRef} className="mb-16 text-center md:mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={headerInView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...spring, delay: 0 }}
            className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-accent/50"
          >
            How it works
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
            animate={headerInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 0.7, delay: 0.12, ease }}
            className="text-glow headline-glow font-display text-display-lg font-bold leading-[0.9] tracking-tighter text-white"
          >
            Three steps. That&apos;s it.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
            animate={headerInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 0.7, delay: 0.25, ease }}
            className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-white/30"
          >
            From raw manuscript to print-ready PDF in under a minute
          </motion.p>
        </div>

        {/* === STEP CARDS === */}
        <div>
          {STEPS.map((step, i) => (
            <Fragment key={step.num}>
              <StepCard step={step} index={i} />
              {i < STEPS.length - 1 && <Connector />}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
