'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'

const ease = [0.25, 0.4, 0.25, 1] as const

const TEMPLATES = [
  { key: 'symphony', name: 'Symphony', tag: 'Academic', font: 'Crimson Pro', baseline: '12pt' },
  { key: 'chicago', name: 'Chicago', tag: 'Academic', font: 'EB Garamond', baseline: '12pt' },
  { key: 'paperback', name: 'Paperback', tag: 'Fiction', font: 'Alegreya Sans', baseline: '11pt' },
  { key: 'chronicle', name: 'Chronicle', tag: 'Editorial', font: 'TeX Gyre Heros', baseline: '11pt' },
  { key: 'exhibit', name: 'Exhibit', tag: 'Trade', font: 'Alegreya', baseline: '11pt' },
  { key: 'matrix', name: 'Matrix', tag: 'Business', font: 'Inter Tight', baseline: '11pt' },
  { key: 'avantgarde', name: 'Avant-Garde', tag: 'Creative', font: 'Source Sans 3', baseline: '11pt' },
  { key: 'minimal', name: 'Minimal', tag: 'Basic', font: 'Latin Modern', baseline: '12pt' },
  { key: 'cinema', name: 'Cinema', tag: 'Screenplay', font: 'Courier Prime', baseline: '12pt', coming: true },
  { key: 'international', name: 'International', tag: 'Swiss', font: 'Helvetica Neue', baseline: '10pt', coming: true },
  { key: 'operator', name: 'Operator', tag: 'Technical', font: 'JetBrains Mono', baseline: '10pt', coming: true },
]

/**
 * Template Gallery — "Plates" layout
 *
 * Not a carousel. A simple grid of gallery plates,
 * like a Taschen book's image index.
 * Each shows a mini page mockup with the template's
 * typographic character.
 */

function PlateContent({ t }: { t: typeof TEMPLATES[number] }) {
  const isComing = 'coming' in t && t.coming
  return (
    <>
      {/* Page mockup */}
      <div className={`relative aspect-[2/3] overflow-hidden border bg-[#fafaf5] transition-all duration-300 ${
        isComing
          ? 'border-white/[0.04] opacity-50'
          : 'border-white/[0.06] group-hover:border-white/[0.15] group-hover:shadow-editorial'
      }`}>
        {isComing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <span className="border border-white/[0.15] bg-[#050505]/80 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/50">
              Coming soon
            </span>
          </div>
        )}
        <div className="flex h-full flex-col px-[14%] py-[10%]">
          <p className="mb-3 text-center font-mono text-[4px] uppercase tracking-[0.35em] text-black/10">
            The Glass Garden
          </p>
          <div className="mb-3 text-center">
            <p className="font-mono text-[5px] uppercase tracking-[0.25em] text-black/20">
              Chapter One
            </p>
            <h3 className="mt-1 text-[10px] font-normal text-black/60" style={{ fontFamily: 'Georgia, serif' }}>
              The Beginning
            </h3>
          </div>
          <div className="flex-1 space-y-[2px]">
            {['The morning light filtered through the old',
              'windows of the library, casting long shadows',
              'across the worn wooden desk where she had',
              'spent every morning for the past three years.',
              '',
              'She picked up the manuscript — three hundred',
              'pages of her life\u2019s work, still unfinished,',
            ].map((line, i) => {
              if (line === '') return <div key={i} className="h-[3px]" />
              return (
                <p key={i} className="text-[5px] leading-[1.7] text-black/30">
                  {line}
                </p>
              )
            })}
          </div>
          <div className="mt-2 text-center">
            <span className="font-mono text-[4px] tracking-[0.3em] text-black/15">7</span>
          </div>
        </div>
      </div>

      {/* Caption — below the plate, textbook style */}
      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <p className={`font-display text-sm font-semibold tracking-tight transition-colors ${isComing ? 'text-white/40' : 'text-white group-hover:text-white'}`}>
            {t.name}
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">
            {t.tag}
          </p>
        </div>
        <p className="font-mono text-[10px] text-white/30">
          {t.font} &middot; {t.baseline}
        </p>
      </div>
    </>
  )
}

function TemplatePlate({ t, index, inView }: { t: typeof TEMPLATES[number]; index: number; inView: boolean }) {
  const isComing = 'coming' in t && t.coming

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.06, ease }}
    >
      {isComing ? (
        <div className="group block cursor-default">
          <PlateContent t={t} />
        </div>
      ) : (
        <Link href={`/app?template=${t.key}`} className="group block">
          <PlateContent t={t} />
        </Link>
      )}
    </motion.div>
  )
}

export function TemplateGrid() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })
  const gridInView = useInView(sectionRef, { once: true, margin: '-80px' })

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 overflow-hidden">
      {/* Background image — fanned books from above */}
      <div className="absolute inset-0">
        <Image
          src="/images/books-fanned.webp"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          style={{ filter: 'grayscale(50%) brightness(0.1)' }}
        />
        <div className="absolute inset-0 bg-[#050505]/85" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 md:px-8">

        {/* ── HEADER — editorial ── */}
        <div ref={headerRef} className="mb-16 max-w-2xl md:mb-20">
          <motion.p
            initial={{ opacity: 0 }}
            animate={headerInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, ease }}
            className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40"
          >
            Plates 1&ndash;11
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="font-display text-display-lg font-extrabold leading-[0.9] tracking-tighter text-white"
          >
            Eleven typographic
            <br />
            systems.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="mt-6 max-w-xl font-body text-lg leading-relaxed text-white/50"
          >
            Every template is a complete typographic system &mdash; not a theme.
            Baseline grids, golden-ratio scales, calculated margins.
          </motion.p>
        </div>

        {/* ── GALLERY GRID ── */}
        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4 md:gap-10">
          {TEMPLATES.map((t, i) => (
            <TemplatePlate key={t.key} t={t} index={i} inView={gridInView} />
          ))}
        </div>
      </div>
    </section>
  )
}
