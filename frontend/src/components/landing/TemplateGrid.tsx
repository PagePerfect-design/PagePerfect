'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { Reveal } from './Reveal'

// LAW 1: Spring physics config
const spring = { type: 'spring' as const, stiffness: 100, damping: 20 }

const TEMPLATES = [
  { key: 'symphony',   name: 'Symphony',    tag: 'Academic',  color: '#3b82f6' },
  { key: 'chronicle',  name: 'Chronicle',   tag: 'Editorial', color: '#10b981' },
  { key: 'exhibit',    name: 'Exhibit',     tag: 'Trade',     color: '#f59e0b' },
  { key: 'matrix',     name: 'Matrix',      tag: 'Business',  color: '#8b5cf6' },
  { key: 'avantgarde', name: 'Avant-Garde', tag: 'Creative',  color: '#f43f5e' },
  { key: 'paperback',  name: 'Paperback',   tag: 'Fiction',   color: '#06b6d4' },
  { key: 'chicago',    name: 'Chicago',     tag: 'Academic',  color: '#94a3b8' },
  { key: 'minimal',    name: 'Minimal',     tag: 'Basic',     color: '#cbd5e1' },
]

function BookCover({ color }: { color: string }) {
  const lines = [65, 72, 58, 70, 63, 75, 55, 68]
  return (
    <div className="relative mx-auto aspect-[2/3] w-[75%]">
      <div
        className="absolute -left-1 top-2 bottom-2 w-[3px] rounded-l"
        style={{ background: `linear-gradient(to right, ${color}40, transparent)` }}
      />
      <div className="h-full w-full rounded-sm bg-[#fafaf5] p-[14%] shadow-sm">
        <div className="mb-[12%]">
          <div className="h-[3px] w-[55%] rounded-full" style={{ backgroundColor: `${color}90` }} />
          <div className="mt-[8%] h-[2px] w-[35%] rounded-full bg-black/10" />
          <div className="mx-auto mt-[6%] h-[1px] w-[20%] bg-black/5" />
        </div>
        <div className="space-y-[6%]">
          {lines.map((w, i) => (
            <div
              key={i}
              className="h-[1.5px] rounded-full bg-black/[0.08]"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
        <div className="mt-[8%] text-center">
          <div className="mx-auto h-[1.5px] w-[8%] rounded-full bg-black/10" />
        </div>
      </div>
    </div>
  )
}

export function TemplateGrid() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '-80px' })
  const [activeIndex, setActiveIndex] = useState(0)

  const updateActiveIndex = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    const scrollLeft = container.scrollLeft
    const cardWidth = container.scrollWidth / TEMPLATES.length
    const idx = Math.round(scrollLeft / cardWidth)
    setActiveIndex(Math.min(idx, TEMPLATES.length - 1))
  }, [])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    container.addEventListener('scroll', updateActiveIndex, { passive: true })
    return () => container.removeEventListener('scroll', updateActiveIndex)
  }, [updateActiveIndex])

  return (
    <section ref={sectionRef} className="section-separator relative overflow-hidden py-32 md:py-44">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(59,130,246,0.04)_0%,transparent_70%)]" />
      </div>

      {/* Atmospheric image — faded books behind the grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <Image
          src="/images/books-fanned.webp"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-void via-transparent to-void" />
      </div>

      <div className="relative">
        <Reveal>
          <div className="mb-16 px-6 text-center md:mb-20 md:px-8">
            <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/20">Templates</div>
            <h2 className="text-glow headline-glow font-display text-display-lg font-bold leading-[0.9] tracking-tighter text-white">
              Eight ways to look{' '}
              <span className="gradient-accent-text">published</span>.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-xl text-white/30">
              Every template is a complete typographic system.
              Pick one. Your text does the rest.
            </p>
          </div>
        </Reveal>

        {/* Horizontal snap-scroll showroom */}
        <div
          ref={scrollRef}
          className="snap-x-mandatory flex gap-5 overflow-x-auto px-[max(1.5rem,calc((100vw-1200px)/2))] pb-8 md:gap-6"
          style={{ scrollbarWidth: 'none' }}
        >
          {TEMPLATES.map((t, i) => (
            <motion.div
              key={t.key}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{
                ...spring,
                delay: i * 0.07,
              }}
              className="snap-center flex-shrink-0"
              style={{ width: 'clamp(260px, 30vw, 320px)' }}
            >
              <Link
                href={`/app?template=${t.key}`}
                className={`group relative block overflow-hidden border transition-all duration-500 ${
                  activeIndex === i
                    ? 'scale-100 border-white/[0.12] opacity-100'
                    : 'scale-90 border-white/[0.04] opacity-60 blur-[1px]'
                }`}
                style={{
                  background: activeIndex === i
                    ? `linear-gradient(135deg, ${t.color}10 0%, transparent 60%)`
                    : 'rgba(15, 15, 22, 0.5)',
                  boxShadow: activeIndex === i
                    ? `0 20px 50px -12px ${t.color}80`
                    : '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                {/* Book cover area */}
                <div
                  className="relative flex items-center justify-center py-10 md:py-12"
                  style={{
                    background: `linear-gradient(135deg, ${t.color}08 0%, transparent 60%)`,
                  }}
                >
                  <BookCover color={t.color} />
                  <div
                    className="pointer-events-none absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${t.color}40, transparent)`,
                    }}
                  />
                </div>

                {/* Card info */}
                <div className="p-4 md:p-5">
                  <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-white/20">
                    {t.tag}
                  </div>
                  <h3 className="font-display text-base font-bold tracking-tighter text-white transition-colors group-hover:text-accent md:text-lg">
                    {t.name}
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
          ))}
        </div>

        {/* Scroll indicator dots */}
        <div className="mt-6 flex justify-center gap-2">
          {TEMPLATES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const container = scrollRef.current
                if (!container) return
                const cardWidth = container.scrollWidth / TEMPLATES.length
                container.scrollTo({ left: cardWidth * i, behavior: 'smooth' })
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeIndex === i
                  ? 'w-6 bg-accent'
                  : 'w-1.5 bg-white/10 hover:bg-white/20'
              }`}
              aria-label={`Scroll to template ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
