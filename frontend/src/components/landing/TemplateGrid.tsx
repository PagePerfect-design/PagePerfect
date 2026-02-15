'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'

// ── Animation tokens ────────────────────────────────────────────────
const spring = { type: 'spring' as const, stiffness: 100, damping: 20 }
const ease = [0.25, 0.4, 0.25, 1] as const

// ── Template data ───────────────────────────────────────────────────
const TEMPLATES = [
  {
    key: 'chicago',
    name: 'Chicago',
    tag: 'Academic',
    color: '#94a3b8',
    fontLabel: 'DejaVu Serif',
    baseline: '12pt',
    alignment: 'Justified',
    features: ['Paragraph indent', 'Centered title', 'Numbered sections', 'Running header'],
    desc: 'Traditional academic formatting rooted in the Chicago Manual of Style. Serif typography, generous margins, paragraph indentation.',
  },
  {
    key: 'symphony',
    name: 'Symphony',
    tag: 'Academic',
    color: '#3b82f6',
    fontLabel: 'DejaVu Serif',
    baseline: '12pt',
    alignment: 'Justified',
    features: ['Ornamental headings', 'Micro-typography', 'Extended white-space', 'Full alignment system'],
    desc: 'Refined academic typesetting with ornamental chapter openings, micro-typography controls, and modular spacing.',
  },
  {
    key: 'paperback',
    name: 'Paperback',
    tag: 'Fiction',
    color: '#06b6d4',
    fontLabel: 'Lato',
    baseline: '11pt',
    alignment: 'Ragged-right',
    features: ['Sans-serif body', 'Modern trade feel', 'Tighter line spacing', 'Clean headers'],
    desc: 'Contemporary trade book design. Sans-serif font, ragged-right alignment, approachable modern aesthetic.',
  },
  {
    key: 'chronicle',
    name: 'Chronicle',
    tag: 'Editorial',
    color: '#10b981',
    fontLabel: 'DejaVu Sans',
    baseline: '11pt',
    alignment: 'Ragged-right',
    features: ['No paragraph indent', 'Editorial layout', 'Tight spacing', 'Sans-serif body'],
    desc: 'Newspaper-like precision with sans-serif typography, no indentation, and optimized editorial layouts.',
  },
  {
    key: 'exhibit',
    name: 'Exhibit',
    tag: 'Trade',
    color: '#f59e0b',
    fontLabel: 'Lato',
    baseline: '11pt',
    alignment: 'Ragged-right',
    features: ['Generous white-space', 'Light headings', 'No indent', 'Gallery aesthetic'],
    desc: 'Modern trade design with generous breathing room, light heading weights, and gallery-clean presentation.',
  },
  {
    key: 'matrix',
    name: 'Matrix',
    tag: 'Business',
    color: '#8b5cf6',
    fontLabel: 'Inter',
    baseline: '11pt',
    alignment: 'Ragged-right',
    features: ['Geometric sans', 'Structured grid', 'Corporate clarity', 'Tight hierarchy'],
    desc: 'Professional corporate typography. Geometric sans-serif, structured spacing, designed for business documents.',
  },
  {
    key: 'avantgarde',
    name: 'Avant-Garde',
    tag: 'Creative',
    color: '#f43f5e',
    fontLabel: 'Source Sans 3',
    baseline: '11pt',
    alignment: 'Ragged-right',
    features: ['Experimental layout', 'Creative spacing', 'Asymmetric headings', 'Humanist sans'],
    desc: 'Experimental creative typesetting with asymmetric heading treatment and generous space for artistic expression.',
  },
  {
    key: 'minimal',
    name: 'Minimal',
    tag: 'Basic',
    color: '#cbd5e1',
    fontLabel: 'System default',
    baseline: '12pt',
    alignment: 'Justified',
    features: ['BasicTeX compatible', 'No custom fonts', 'Plain headers', 'Maximum portability'],
    desc: 'Utilitarian LaTeX output with maximum compatibility. No custom fonts or fancy headers — pure content.',
  },
]

// ── Body text lines (reused across mockups) ─────────────────────────
const BODY_LINES = [
  'The morning light filtered through the old',
  'windows of the library, casting long shadows',
  'across the worn wooden desk where she had',
  'spent every morning for the past three years.',
  '',
  'She picked up the manuscript — three hundred',
  'pages of her life\u2019s work, still unfinished,',
  'still demanding more.',
]

// ── Unique heading renderers per template ───────────────────────────

function ChicagoHeading() {
  return (
    <div className="mb-4 text-center">
      <p className="text-[6px] uppercase tracking-[0.25em] text-black/25">Chapter One</p>
      <h3 className="mt-1 text-[12px] font-normal text-black/70" style={{ fontFamily: 'Georgia, serif' }}>
        The Beginning
      </h3>
    </div>
  )
}

function SymphonyHeading() {
  return (
    <div className="mb-4 text-center">
      <p className="text-[5px] uppercase tracking-[0.4em] text-black/20">Chapter One</p>
      <div className="mx-auto mt-1 flex items-center justify-center gap-1.5">
        <div className="h-px w-3 bg-black/10" />
        <span className="text-[6px] text-black/15">&loz;</span>
        <div className="h-px w-3 bg-black/10" />
      </div>
      <h3 className="mt-1.5 text-[11px] font-normal italic text-black/65" style={{ fontFamily: 'Georgia, serif' }}>
        The Beginning
      </h3>
    </div>
  )
}

function PaperbackHeading() {
  return (
    <div className="mb-4 text-center">
      <h3 className="text-[12px] font-light tracking-wide text-black/60" style={{ fontFamily: 'system-ui, sans-serif' }}>
        Chapter One
      </h3>
      <div className="mx-auto mt-1.5 h-px w-5 bg-black/10" />
    </div>
  )
}

function ChronicleHeading() {
  return (
    <div className="mb-4">
      <div className="mb-1.5 h-[2px] w-5 bg-black/20" />
      <p className="text-[5px] font-bold uppercase tracking-[0.2em] text-black/30" style={{ fontFamily: 'system-ui, sans-serif' }}>
        Chapter One
      </p>
      <h3 className="mt-0.5 text-[12px] font-bold text-black/70" style={{ fontFamily: 'system-ui, sans-serif' }}>
        The Beginning
      </h3>
    </div>
  )
}

function ExhibitHeading() {
  return (
    <div className="mb-5 text-center">
      <p className="text-[5px] lowercase tracking-[0.3em] text-black/20" style={{ fontFamily: 'system-ui, sans-serif' }}>
        chapter one
      </p>
      <h3 className="mt-2 text-[13px] font-extralight tracking-wider text-black/60" style={{ fontFamily: 'system-ui, sans-serif' }}>
        The Beginning
      </h3>
      <div className="mx-auto mt-2 h-px w-4 bg-black/8" />
    </div>
  )
}

function MatrixHeading() {
  return (
    <div className="mb-4">
      <div className="flex items-baseline gap-1.5">
        <span className="text-[14px] font-bold text-black/10" style={{ fontFamily: 'system-ui, sans-serif' }}>01</span>
        <div className="h-px flex-1 bg-black/5" />
      </div>
      <h3 className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-black/65" style={{ fontFamily: 'system-ui, sans-serif' }}>
        Chapter One
      </h3>
    </div>
  )
}

function AvantGardeHeading() {
  return (
    <div className="mb-5">
      <div className="flex items-end gap-2">
        <h3 className="text-[13px] font-light lowercase tracking-[0.05em] text-black/55" style={{ fontFamily: 'system-ui, sans-serif' }}>
          chapter
        </h3>
        <span className="text-[20px] font-extralight leading-none text-black/10" style={{ fontFamily: 'system-ui, sans-serif' }}>
          1
        </span>
      </div>
      <div className="mt-1 h-px w-8 bg-gradient-to-r from-black/15 to-transparent" />
    </div>
  )
}

function MinimalHeading() {
  return (
    <div className="mb-4">
      <h3 className="text-[12px] font-bold text-black/65" style={{ fontFamily: 'Georgia, serif' }}>
        1 &nbsp;Chapter One
      </h3>
    </div>
  )
}

const HEADING_MAP: Record<string, () => React.JSX.Element> = {
  chicago: ChicagoHeading,
  symphony: SymphonyHeading,
  paperback: PaperbackHeading,
  chronicle: ChronicleHeading,
  exhibit: ExhibitHeading,
  matrix: MatrixHeading,
  avantgarde: AvantGardeHeading,
  minimal: MinimalHeading,
}

// ── Template page mockup ────────────────────────────────────────────
function TemplatePage({ template }: { template: typeof TEMPLATES[number] }) {
  const Heading = HEADING_MAP[template.key]
  const isSerif = ['chicago', 'symphony', 'minimal'].includes(template.key)
  const isJustified = template.alignment === 'Justified'
  const hasIndent = ['chicago', 'symphony', 'minimal'].includes(template.key)
  const hasRunningHeader = template.key !== 'minimal'
  const fontFamily = isSerif ? 'Georgia, "Times New Roman", serif' : 'system-ui, -apple-system, sans-serif'

  return (
    <div className="aspect-[2/3] overflow-hidden rounded-sm bg-[#fafaf5]" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)' }}>
      <div className="flex h-full flex-col px-[12%] py-[8%]">
        {/* Running header */}
        {hasRunningHeader && (
          <p className="mb-3 text-center text-[4px] uppercase tracking-[0.35em] text-black/12">
            The Glass Garden
          </p>
        )}

        {/* Chapter heading — unique per template */}
        <Heading />

        {/* Body text */}
        <div
          className="flex-1 space-y-[2px]"
          style={{ fontFamily, textAlign: isJustified ? 'justify' : 'left' }}
        >
          {BODY_LINES.map((line, i) => {
            if (line === '') return <div key={i} className="h-[3px]" />
            const isParaStart = i === 0 || BODY_LINES[i - 1] === ''
            return (
              <p
                key={i}
                className="text-[6px] leading-[1.7] text-black/35"
                style={{ textIndent: hasIndent && isParaStart ? '1em' : 0 }}
              >
                {line}
              </p>
            )
          })}
        </div>

        {/* Page number */}
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <div className="h-px w-3 bg-gradient-to-r from-transparent to-black/8" />
          <span className="text-[5px] tracking-[0.3em] text-black/15" style={{ fontFamily }}>7</span>
          <div className="h-px w-3 bg-gradient-to-l from-transparent to-black/8" />
        </div>
      </div>
    </div>
  )
}

// ── Carousel navigation arrow ───────────────────────────────────────
function NavButton({
  direction,
  onClick,
  disabled,
}: {
  direction: 'prev' | 'next'
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Previous template' : 'Next template'}
      className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.06] disabled:pointer-events-none disabled:opacity-30"
    >
      <svg
        className="h-4 w-4 text-white/50 transition-colors group-hover:text-white/80"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        {direction === 'prev' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  )
}

// ── Main export ─────────────────────────────────────────────────────
export function TemplateGrid() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })
  const carouselInView = useInView(sectionRef, { once: true, margin: '-80px' })

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    slidesToScroll: 1,
  })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
      setCanScrollPrev(emblaApi.canScrollPrev())
      setCanScrollNext(emblaApi.canScrollNext())
    }
    emblaApi.on('select', onSelect)
    onSelect()
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi])

  // Distance from center for depth cascade (handles loop wrapping)
  const getDistance = (i: number) =>
    Math.min(
      Math.abs(i - selectedIndex),
      TEMPLATES.length - Math.abs(i - selectedIndex),
    )

  const active = TEMPLATES[selectedIndex]

  return (
    <section ref={sectionRef} className="section-separator relative overflow-hidden py-32 md:py-44">
      {/* === ATMOSPHERIC LAYERS === */}

      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(59,130,246,0.04)_0%,transparent_70%)]" />
      </div>

      {/* Atmospheric image */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <Image src="/images/books-fanned.webp" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-void via-transparent to-void" />
      </div>

      {/* Dot grid */}
      <div className="pointer-events-none absolute inset-0 bg-dot-grid-subtle" />

      {/* Active template glow orb — follows template color */}
      <div className="pointer-events-none absolute inset-0 transition-all duration-700">
        <div
          className="absolute left-1/2 top-[55%] h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.06] blur-3xl transition-all duration-700"
          style={{ backgroundColor: active.color }}
        />
      </div>

      <div className="relative">
        {/* === SECTION HEADER === */}
        <div ref={headerRef} className="mb-16 px-6 text-center md:mb-20 md:px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={headerInView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...spring, delay: 0 }}
            className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-accent/50"
          >
            Templates
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
            animate={headerInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 0.7, delay: 0.12, ease }}
            className="text-glow headline-glow font-display text-display-lg font-bold leading-[0.9] tracking-tighter text-white"
          >
            Eight ways to look{' '}
            <span className="gradient-accent-text">published</span>.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
            animate={headerInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 0.7, delay: 0.25, ease }}
            className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/30"
          >
            Every template is a complete typographic system — not a theme.
            Baseline grids, golden-ratio scales, calculated margins.
          </motion.p>
        </div>

        {/* === EMBLA CAROUSEL === */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={carouselInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease, delay: 0.2 }}
        >
          <div className="relative">
            {/* Carousel viewport */}
            <div ref={emblaRef} className="overflow-hidden">
              <div className="flex">
                {TEMPLATES.map((t, i) => {
                  const dist = getDistance(i)
                  const isActive = dist === 0
                  const scale = isActive ? 1 : dist === 1 ? 0.88 : 0.78
                  const opacity = isActive ? 1 : dist === 1 ? 0.5 : 0.25

                  return (
                    <div
                      key={t.key}
                      className="min-w-0 flex-[0_0_80%] px-3 sm:flex-[0_0_55%] md:flex-[0_0_42%] lg:flex-[0_0_34%]"
                    >
                      <div
                        className="transition-all duration-500"
                        style={{ transform: `scale(${scale})`, opacity }}
                      >
                        <button
                          onClick={() => scrollTo(i)}
                          className="group relative block w-full cursor-pointer overflow-hidden rounded-2xl border text-left transition-all duration-500"
                          style={{
                            borderColor: isActive ? `${t.color}30` : 'rgba(255,255,255,0.06)',
                            background: isActive
                              ? `linear-gradient(135deg, ${t.color}08 0%, transparent 50%)`
                              : 'rgba(15,15,22,0.5)',
                            boxShadow: isActive
                              ? `0 20px 60px -12px ${t.color}50, 0 0 40px -20px ${t.color}30`
                              : '0 4px 20px rgba(0,0,0,0.3)',
                          }}
                        >
                          {/* Page mockup area */}
                          <div className="relative p-6 pb-4 md:p-8 md:pb-5">
                            {/* Subtle color tint behind page */}
                            <div
                              className="pointer-events-none absolute inset-0 opacity-[0.03]"
                              style={{ background: `radial-gradient(ellipse at center, ${t.color}, transparent 70%)` }}
                            />
                            <div className="relative mx-auto w-[85%] max-w-[220px]">
                              <TemplatePage template={t} />
                            </div>
                          </div>

                          {/* Accent bar */}
                          <div
                            className="h-px transition-opacity duration-500"
                            style={{
                              background: `linear-gradient(90deg, transparent, ${t.color}${isActive ? '40' : '15'}, transparent)`,
                            }}
                          />

                          {/* Card info */}
                          <div className="p-4 md:p-5">
                            <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.15em]" style={{ color: `${t.color}80` }}>
                              {t.tag}
                            </div>
                            <h3 className="font-display text-base font-bold tracking-tight text-white md:text-lg">
                              {t.name}
                            </h3>
                            <p className="mt-1.5 text-[12px] leading-relaxed text-white/25">
                              {t.fontLabel} · {t.baseline} · {t.alignment}
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Navigation arrows — positioned at sides */}
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 md:px-6">
              <div className="pointer-events-auto">
                <NavButton direction="prev" onClick={scrollPrev} disabled={!canScrollPrev} />
              </div>
              <div className="pointer-events-auto">
                <NavButton direction="next" onClick={scrollNext} disabled={!canScrollNext} />
              </div>
            </div>
          </div>

          {/* Dot indicators */}
          <div className="mt-8 flex justify-center gap-2">
            {TEMPLATES.map((t, i) => (
              <button
                key={t.key}
                onClick={() => scrollTo(i)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: selectedIndex === i ? 24 : 6,
                  backgroundColor: selectedIndex === i ? t.color : 'rgba(255,255,255,0.1)',
                }}
                aria-label={`Go to ${t.name}`}
              />
            ))}
          </div>
        </motion.div>

        {/* === ACTIVE TEMPLATE DETAILS PANEL === */}
        <div className="mx-auto mt-12 max-w-2xl px-6 md:mt-16 md:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
              className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm"
            >
              {/* Top accent bar */}
              <div
                className="h-px transition-colors duration-500"
                style={{ background: `linear-gradient(90deg, transparent, ${active.color}40, transparent)` }}
              />

              <div className="p-6 md:p-8">
                {/* Name + tag */}
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-xl font-bold tracking-tight text-white md:text-2xl">
                    {active.name}
                  </h3>
                  <span
                    className="rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]"
                    style={{ borderColor: `${active.color}30`, color: `${active.color}90` }}
                  >
                    {active.tag}
                  </span>
                </div>

                {/* Description */}
                <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-white/35">
                  {active.desc}
                </p>

                {/* Specs row */}
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  {[
                    { label: 'Font', value: active.fontLabel },
                    { label: 'Baseline', value: active.baseline },
                    { label: 'Alignment', value: active.alignment },
                  ].map((spec) => (
                    <div key={spec.label} className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rounded-full" style={{ backgroundColor: `${active.color}60` }} />
                      <span className="font-mono text-[10px] text-white/20">{spec.label}</span>
                      <span className="font-mono text-[10px] text-white/45">{spec.value}</span>
                    </div>
                  ))}
                </div>

                {/* Feature tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {active.features.map((f) => (
                    <span
                      key={f}
                      className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 font-mono text-[10px] text-white/30"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-6 flex items-center gap-4">
                  <Link
                    href={`/app?template=${active.key}`}
                    className="group inline-flex items-center gap-2 rounded-full border px-5 py-2.5 font-mono text-xs font-medium transition-all duration-300 hover:shadow-pill"
                    style={{
                      borderColor: `${active.color}30`,
                      color: `${active.color}`,
                      background: `${active.color}08`,
                    }}
                  >
                    Try {active.name}
                    <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <span className="text-[12px] text-white/15">or keep browsing</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
