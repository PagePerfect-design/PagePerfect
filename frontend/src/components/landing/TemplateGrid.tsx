'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'

// ── Types & Config ──────────────────────────────────────────────────

type LayoutType = 'academic' | 'trade' | 'swiss' | 'screenplay' | 'technical'

const TEMPLATES = [
  { key: 'symphony', name: 'Symphony', tag: 'Academic', font: 'EB Garamond', baseline: '12pt', layout: 'academic' as LayoutType },
  { key: 'paperback', name: 'Paperback', tag: 'Fiction', font: 'Alegreya Sans', baseline: '11pt', layout: 'trade' as LayoutType },
  { key: 'chronicle', name: 'Chronicle', tag: 'Editorial', font: 'TeX Gyre Heros', baseline: '11pt', layout: 'swiss' as LayoutType },
  { key: 'matrix', name: 'Matrix', tag: 'Business', font: 'Fira Sans', baseline: '10pt', layout: 'swiss' as LayoutType },
  { key: 'chicago', name: 'Chicago', tag: 'Academic', font: 'ETbb (Bembo)', baseline: '11pt', layout: 'academic' as LayoutType },
  { key: 'exhibit', name: 'Exhibit', tag: 'Trade', font: 'Fira Sans', baseline: '10pt', layout: 'trade' as LayoutType },
  { key: 'avantgarde', name: 'Avant-Garde', tag: 'Creative', font: 'Source Sans 3', baseline: '11pt', layout: 'swiss' as LayoutType },
  { key: 'cinema', name: 'Cinema', tag: 'Screenplay', font: 'TeX Gyre Cursor', baseline: '12pt', layout: 'screenplay' as LayoutType },
  { key: 'international', name: 'International', tag: 'Swiss', font: 'TeX Gyre Heros', baseline: '9pt', layout: 'swiss' as LayoutType },
  { key: 'minimal', name: 'Minimal', tag: 'Basic', font: 'Latin Modern', baseline: '12pt', layout: 'academic' as LayoutType },
  { key: 'heirloom', name: 'Heirloom', tag: 'Cookbook', font: 'Fira Sans', baseline: '11pt', layout: 'trade' as LayoutType },
  { key: 'operator', name: 'Operator', tag: 'Technical', font: 'Fira Sans', baseline: '10pt', layout: 'technical' as LayoutType },
]

// ── Mini Page Components ────────────────────────────────────────────
// Each layout architecture draws a distinct mini-page so
// "Matrix" looks radically different from "Symphony".

// 1. ACADEMIC — centered, serif, classical
function AcademicPage() {
  return (
    <div className="flex h-full flex-col px-[12%] py-[12%] font-body text-[5px] leading-[1.6] text-ink/60">
      <div className="mb-4 text-center">
        <span className="font-mono text-[4px] uppercase tracking-[0.2em] text-ink/20">Chapter One</span>
        <div className="mt-1 font-display text-[8px] font-bold text-ink">The Architecture</div>
        <div className="mx-auto mt-1 h-px w-4 bg-ink/20" />
      </div>
      <p className="indent-[1em] text-justify">
        The morning light filtered through the old windows, casting long shadows across the worn wooden desk.
      </p>
      <p className="mt-1 indent-[1em] text-justify">
        She picked up the manuscript, three hundred pages of life work. The margins were wrong. The font was wrong.
      </p>
      <div className="mt-auto text-center font-mono text-[4px] text-ink/20">7</div>
    </div>
  )
}

// 2. TRADE — ragged right, sans, airy
function TradePage() {
  return (
    <div className="flex h-full flex-col px-[12%] py-[15%] font-display text-[5px] leading-[1.8] text-ink/60">
      <div className="mb-6">
        <div className="font-display text-[16px] font-bold leading-none text-ink/10">1</div>
        <div className="mt-1 font-display text-[7px] font-semibold text-ink">The Departure</div>
      </div>
      <p>The morning light filtered through the old windows of the library.</p>
      <p className="mt-2">She picked up the manuscript. Three hundred pages of her life&rsquo;s work, still unfinished.</p>
      <div className="mt-auto flex justify-between border-t border-ink/5 pt-1">
        <span className="font-mono text-[3px] uppercase tracking-wider text-ink/20">Author</span>
        <span className="font-mono text-[3px] text-ink/20">24</span>
      </div>
    </div>
  )
}

// 3. SWISS / GRID — bold, geometric, ruled
function SwissPage() {
  return (
    <div className="flex h-full flex-col p-[8%] font-display">
      <div className="mb-3 border-b-[1.5px] border-ink" />
      <div className="mb-4 grid grid-cols-[1fr_2fr] gap-1">
        <div className="text-[12px] font-bold leading-[0.8] text-ink">01</div>
        <div className="text-[5px] font-bold uppercase leading-tight tracking-tight text-ink">
          The Grid<br />System
        </div>
      </div>
      <div className="grid h-full grid-cols-[1fr_2fr] gap-2">
        <div className="border-t border-ink/10 pt-1">
          <div className="mb-1 h-[2px] w-full bg-ink/10" />
          <div className="text-[3px] leading-[1.4] text-ink/40">Fig 1.1<br />Ratio</div>
        </div>
        <div className="text-justify text-[4px] leading-[1.5] text-ink/60">
          The grid is a tool for ordering content. It provides a framework for decision making.
          <div className="mt-2 h-8 w-full bg-ink/5" />
        </div>
      </div>
    </div>
  )
}

// 4. SCREENPLAY — mono, centered dialogue
function ScreenplayPage() {
  return (
    <div className="flex h-full flex-col px-[12%] py-[12%] font-mono text-[4.5px] leading-[1.4] text-ink/70">
      <div className="mb-3">
        <span className="uppercase text-ink/40">Int. Coffee Shop - Day</span>
      </div>
      <p className="mb-3">
        The morning light filters through the windows. ALICE (30s) sits alone.
      </p>
      <div className="mx-auto mb-1 w-[60%] text-center uppercase tracking-wide">Alice</div>
      <div className="mx-auto mb-3 w-[50%] text-center">
        (whispering)<br />
        This isn&rsquo;t working. The margins are all wrong.
      </div>
      <div className="mx-auto mb-1 w-[60%] text-center uppercase tracking-wide">Bob</div>
      <div className="mx-auto w-[50%] text-center">
        Then fix them.
      </div>
    </div>
  )
}

// 5. TECHNICAL — admonition boxes, code blocks, numbered steps
function TechnicalPage() {
  return (
    <div className="flex h-full flex-col px-[10%] py-[12%] font-display text-[5px] leading-[1.6] text-ink/60">
      <div className="mb-3 flex items-center gap-1 text-reg">
        <span className="text-[4px] font-bold uppercase tracking-widest">Warning</span>
        <div className="h-px flex-1 bg-reg/20" />
      </div>

      <div className="mb-3 border-l-[1.5px] border-reg bg-reg/5 p-1.5">
        <p className="font-medium text-ink/80">Configuration Error</p>
        <p className="mt-0.5 text-[4px] text-ink/50">Ensure your baseline grid is divisible by the leading.</p>
      </div>

      <p className="mb-2">1. Install the package.</p>
      <div className="rounded bg-ink/5 p-1 font-mono text-[4px] text-ink/40">
        $ npm install grid-system
      </div>
    </div>
  )
}

// ── SVG noise for paper grain (inlined to avoid an HTTP request) ──
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E")`

// ── Plate — the physical "book page" artifact ───────────────────────

function Plate({ t }: { t: (typeof TEMPLATES)[number] }) {
  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[2px] bg-[#fafaf8] shadow-sm transition-all duration-500">
      {/* Paper grain overlay */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-multiply"
        style={{ backgroundImage: NOISE_SVG }}
      />

      {/* Spine crease — left-side shadow */}
      <div className="absolute bottom-0 left-0 top-0 z-10 w-[4%] bg-gradient-to-r from-black/5 to-transparent" />

      {/* Layout-specific content */}
      <div className="relative z-0 h-full w-full">
        {t.layout === 'academic' && <AcademicPage />}
        {t.layout === 'trade' && <TradePage />}
        {t.layout === 'swiss' && <SwissPage />}
        {t.layout === 'screenplay' && <ScreenplayPage />}
        {t.layout === 'technical' && <TechnicalPage />}
      </div>
    </div>
  )
}

// ── Main Grid ───────────────────────────────────────────────────────

export function TemplateGrid() {
  const headerRef = useRef(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-[#080808]" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-8">

        {/* ── Header ── */}
        <div ref={headerRef} className="mb-20 max-w-2xl md:mb-24">
          <motion.p
            initial={{ opacity: 0 }}
            animate={headerInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40"
          >
            Plates 1&ndash;12
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-display-lg font-bold leading-[0.9] tracking-tighter text-white"
          >
            Twelve typographic
            <br />
            systems.
          </motion.h2>
        </div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">
          {TEMPLATES.map((t, i) => (
            <motion.div
              key={t.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <Link
                href={`/app?template=${t.key}`}
                className="group block"
                style={{ perspective: '1000px' }}
              >
                {/* Plate wrapper — lifts and tilts on hover */}
                <div
                  className="relative transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:shadow-2xl"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="transition-transform duration-500 ease-out group-hover:[transform:rotateX(2deg)]">
                    <Plate t={t} />
                  </div>

                  {/* Edge highlight on hover — specular light simulation */}
                  <div className="absolute inset-0 rounded-[2px] ring-1 ring-inset ring-black/5 transition-all duration-500 group-hover:ring-white/20" />
                </div>

                {/* Metadata — below the plate */}
                <div className="mt-5 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-semibold text-white transition-colors group-hover:text-white">
                      {t.name}
                    </h3>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-white/30">{t.tag}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-2">
                    <p className="font-mono text-[9px] text-white/40">{t.font}</p>
                    <p className="font-mono text-[9px] text-white/40">{t.baseline}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
