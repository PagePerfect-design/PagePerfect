'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useInView, type MotionValue } from 'framer-motion'
import { Reveal } from './Reveal'

const TEMPLATES = [
  // ── ICP-first: templates a deadline indie author actually needs ──
  { key: 'paperback',   name: 'Paperback',    tag: 'Fiction',    color: '#06b6d4', shadow: '0 20px 50px -12px rgba(6,182,212,0.5)' },
  { key: 'memoir',      name: 'Memoir',       tag: 'Nonfiction', color: '#d97706', shadow: '0 20px 50px -12px rgba(217,119,6,0.5)' },
  { key: 'chicago',     name: 'Chicago',      tag: 'Academic',   color: '#94a3b8', shadow: '0 20px 50px -12px rgba(148,163,184,0.4)' },
  { key: 'symphony',    name: 'Symphony',     tag: 'Fiction',    color: '#3b82f6', shadow: '0 20px 50px -12px rgba(59,130,246,0.5)' },
  { key: 'minimal',     name: 'Minimal',      tag: 'Basic',      color: '#cbd5e1', shadow: '0 20px 50px -12px rgba(203,213,225,0.3)' },
  { key: 'thesis',      name: 'Thesis',       tag: 'Academic',   color: '#64748b', shadow: '0 20px 50px -12px rgba(100,116,139,0.4)' },
  { key: 'heirloom',    name: 'Heirloom',     tag: 'Cookbook',    color: '#f59e0b', shadow: '0 20px 50px -12px rgba(245,158,11,0.5)' },
  { key: 'verse',       name: 'Verse',        tag: 'Poetry',     color: '#a78bfa', shadow: '0 20px 50px -12px rgba(167,139,250,0.5)' },
  { key: 'operator',    name: 'Operator',     tag: 'Technical',  color: '#0ea5e9', shadow: '0 20px 50px -12px rgba(14,165,233,0.5)' },
  { key: 'matrix',      name: 'Matrix',       tag: 'Business',   color: '#8b5cf6', shadow: '0 20px 50px -12px rgba(139,92,246,0.5)' },
  // ── Specialist templates — still accessible, not hero-featured ──
  { key: 'chronicle',   name: 'Chronicle',    tag: 'Editorial',  color: '#10b981', shadow: '0 20px 50px -12px rgba(16,185,129,0.5)' },
  { key: 'exhibit',     name: 'Exhibit',      tag: 'Trade',      color: '#f59e0b', shadow: '0 20px 50px -12px rgba(245,158,11,0.5)' },
  { key: 'avantgarde',  name: 'Avant-Garde',  tag: 'Creative',   color: '#f43f5e', shadow: '0 20px 50px -12px rgba(244,63,94,0.5)' },
]

function BookCover({ color }: { color: string }) {
  const lines = [65, 72, 58, 70, 63, 75, 55, 68]
  return (
    <div className="relative mx-auto aspect-[2/3] w-[70%]">
      {/* Book spine shadow */}
      <div
        className="absolute -left-1 top-2 bottom-2 w-[3px] rounded-l"
        style={{ background: `linear-gradient(to right, ${color}40, transparent)` }}
      />
      {/* The page */}
      <div className="h-full w-full rounded-sm bg-[#fafaf5] p-[14%] shadow-sm">
        {/* Title block */}
        <div className="mb-[12%]">
          <div className="h-[3px] w-[55%] rounded-full" style={{ backgroundColor: `${color}90` }} />
          <div className="mt-[8%] h-[2px] w-[35%] rounded-full bg-black/10" />
          <div className="mx-auto mt-[6%] h-[1px] w-[20%] bg-black/5" />
        </div>
        {/* Body lines */}
        <div className="space-y-[6%]">
          {lines.map((w, i) => (
            <div
              key={i}
              className="h-[1.5px] rounded-full bg-black/[0.08]"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
        {/* Page number */}
        <div className="mt-[8%] text-center">
          <div className="mx-auto h-[1.5px] w-[8%] rounded-full bg-black/10" />
        </div>
      </div>
    </div>
  )
}

function CarouselCard({
  template,
  progress,
}: {
  template: typeof TEMPLATES[0]
  progress: MotionValue<number>
}) {
  const rotateX = useTransform(progress, [0, 0.5, 1], [12, 0, -4])
  const translateZ = useTransform(progress, [0, 0.5, 1], [-60, 0, 20])
  const scale = useTransform(progress, [0, 0.5, 1], [0.85, 1, 0.98])

  return (
    <motion.div
      style={{
        rotateX,
        translateZ,
        scale,
        transformStyle: 'preserve-3d',
      }}
    >
      <Link
        href={`/app?template=${template.key}`}
        className="group relative block overflow-hidden border border-white/[0.06] bg-[#0a0a10]/80 backdrop-blur-sm transition-all duration-500 hover:-translate-y-3 hover:border-white/[0.12]"
        style={{
          boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = template.shadow
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'
        }}
      >
        {/* Book cover area */}
        <div
          className="relative flex items-center justify-center py-10 md:py-12"
          style={{
            background: `linear-gradient(135deg, ${template.color}15 0%, transparent 60%)`,
          }}
        >
          <BookCover color={template.color} />

          {/* Color bleed glow at bottom */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${template.color}40, transparent)`,
            }}
          />
        </div>

        {/* Card info */}
        <div className="p-4 md:p-5">
          <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-white/20">
            {template.tag}
          </div>
          <h3 className="font-display text-base font-bold tracking-tight text-white transition-colors group-hover:text-accent md:text-lg">
            {template.name}
          </h3>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-white/0 transition-all duration-300 group-hover:text-accent/70">
            <span>Try it</span>
            <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function TemplateShowcase() {
  const containerRef = useRef(null)
  const gridRef = useRef(null)
  const inView = useInView(gridRef, { once: true, margin: '-80px' })

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  return (
    <section ref={containerRef} className="section-separator relative overflow-hidden py-32 md:py-44">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(59,130,246,0.04)_0%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 md:px-8">
        <Reveal>
          <div className="mb-16 text-center md:mb-20">
            <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/20">Templates</div>
            <h2 className="glow-text font-display text-display-lg font-bold tracking-tighter text-white">
              Pick a design.{' '}
              <span className="gradient-accent-text">We handle the rest</span>.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-xl text-white/30">
              Fiction, nonfiction, academic, cookbook, poetry &mdash; each template is a complete
              typographic system tuned for its genre. Three heading variants per template.
            </p>
          </div>
        </Reveal>

        {/* 3D Carousel Grid */}
        <div ref={gridRef} className="perspective-1200">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" style={{ transformStyle: 'preserve-3d' }}>
            {TEMPLATES.map((t, i) => (
              <motion.div
                key={t.key}
                initial={{ opacity: 0, y: 40, rotateX: 15 }}
                animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                transition={{
                  delay: i * 0.07,
                  duration: 0.8,
                  ease: [0.25, 0.4, 0.25, 1],
                }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <CarouselCard
                  template={t}
                  progress={scrollYProgress}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
