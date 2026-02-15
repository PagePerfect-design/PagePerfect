'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import Image from 'next/image'

const ease = [0.25, 0.4, 0.25, 1] as const
const spring = { type: 'spring' as const, stiffness: 100, damping: 20 }

const VIRTUAL_W = 1600
const VIRTUAL_H = 1000

const CALLOUTS = [
  { label: 'Margins', desc: 'Golden-ratio margins replace Word defaults' },
  { label: 'Typography', desc: 'Baseline grid aligns every line of text' },
  { label: 'Structure', desc: 'Drop caps, em-dashes, and proper chapter headings' },
]

export function Comparison() {
  const containerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' })
  const frameInView = useInView(frameRef, { once: true, margin: '-60px' })

  const [sliderPos, setSliderPos] = useState(40)
  const [isDragging, setIsDragging] = useState(false)
  const [frameWidth, setFrameWidth] = useState(0)

  // Measure container for hybrid scaling
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setFrameWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const scale = frameWidth > 0 ? frameWidth / VIRTUAL_W : 1

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = clientX - rect.left
    const pct = Math.max(2, Math.min(98, (x / rect.width) * 100))
    setSliderPos(pct)
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    updatePosition(e.clientX)
  }, [updatePosition])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return
    updatePosition(e.clientX)
  }, [isDragging, updatePosition])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setSliderPos(p => Math.max(2, p - 2))
    if (e.key === 'ArrowRight') setSliderPos(p => Math.min(98, p + 2))
  }, [])

  return (
    <section className="section-separator relative py-32 md:py-44">
      {/* === ATMOSPHERIC DEPTH LAYERS === */}

      {/* Layer 1: Background image */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.025]">
        <Image src="/images/bookshelf-panorama.webp" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050507] via-transparent to-[#050507]" />
      </div>

      {/* Layer 2: Primary glow orb */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(59,130,246,0.06)_0%,transparent_70%)]" />
      </div>

      {/* Layer 3: Secondary glow orb */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-[20%] right-[15%] h-[350px] w-[350px] rounded-full bg-[radial-gradient(ellipse,rgba(168,85,247,0.04)_0%,transparent_70%)]" />
      </div>

      {/* Layer 4: Dot grid */}
      <div className="pointer-events-none absolute inset-0 bg-dot-grid-subtle" />

      {/* === CONTENT === */}
      <div className="relative mx-auto max-w-7xl px-6 md:px-8">

        {/* === HEADER — staggered entrance === */}
        <div ref={headerRef} className="mb-16 text-center md:mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={headerInView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...spring, delay: 0 }}
            className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-accent/50"
          >
            Before &amp; After
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
            animate={headerInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 0.7, delay: 0.12, ease }}
            className="text-glow headline-glow font-display text-4xl font-bold leading-[0.9] tracking-tighter text-white md:text-6xl lg:text-7xl"
          >
            Same words.{' '}
            <span className="gradient-hero-text">Different book.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
            animate={headerInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 0.7, delay: 0.27, ease }}
            className="mx-auto mt-6 max-w-xl border-l-2 border-accent/30 pl-6 text-left text-lg font-light leading-relaxed text-white/30 md:text-xl"
          >
            On the left, a manuscript trapped in Word. On the right,{' '}
            <span className="font-medium text-white/60">the same text, typeset.</span>
          </motion.p>
        </div>

        {/* === COMPARISON FRAME === */}
        <div ref={frameRef}>
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={frameInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ ...spring, delay: 0.35 }}
          >
            <div
              ref={containerRef}
              className="relative mx-auto aspect-[16/10] max-w-5xl cursor-ew-resize select-none overflow-hidden rounded-xl border transition-colors duration-300"
              style={{
                borderColor: isDragging ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.08)',
                boxShadow: isDragging
                  ? '0 8px 32px 0 rgba(0,0,0,0.3), 0 0 60px -20px rgba(59,130,246,0.25)'
                  : '0 8px 32px 0 rgba(0,0,0,0.3)',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* LEFT: Word Doc */}
              <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                <div style={{ width: VIRTUAL_W, height: VIRTUAL_H, transformOrigin: 'top left', transform: `scale(${scale})` }}>
                  <WordDocPanel />
                </div>
              </div>

              {/* RIGHT: PagePerfect */}
              <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}>
                <div style={{ width: VIRTUAL_W, height: VIRTUAL_H, transformOrigin: 'top left', transform: `scale(${scale})` }}>
                  <TypesetPanel />
                </div>
              </div>

              {/* === DIVIDER LINE — always glowing blue === */}
              <div
                className="absolute top-0 bottom-0 z-10 w-[2px]"
                style={{
                  left: `${sliderPos}%`,
                  background: 'linear-gradient(to bottom, transparent, #3b82f6 10%, #3b82f6 90%, transparent)',
                  boxShadow: isDragging
                    ? '0 0 20px 4px rgba(59,130,246,0.8), 0 0 60px 8px rgba(59,130,246,0.3)'
                    : '0 0 12px 2px rgba(59,130,246,0.4)',
                  transition: isDragging ? 'none' : 'box-shadow 0.3s ease',
                }}
              />

              {/* === DRAG HANDLE — rounded, always blue, breathing pulse === */}
              <div
                role="slider"
                tabIndex={0}
                aria-label="Comparison slider"
                aria-valuenow={Math.round(sliderPos)}
                aria-valuemin={0}
                aria-valuemax={100}
                onKeyDown={handleKeyDown}
                className="group absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 outline-none"
                style={{ left: `${sliderPos}%` }}
              >
                {/* Breathing pulse ring */}
                <div
                  className="absolute inset-[-8px] animate-pulse-soft rounded-full bg-accent/10 blur-md transition-opacity duration-300"
                  style={{ opacity: isDragging ? 0 : 1 }}
                />
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-200"
                  style={{
                    borderColor: isDragging ? 'rgba(59,130,246,0.8)' : 'rgba(255,255,255,0.2)',
                    background: isDragging ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.8)',
                    boxShadow: isDragging
                      ? '0 0 30px rgba(59,130,246,0.5), 0 0 60px rgba(59,130,246,0.2)'
                      : '0 4px 20px rgba(0,0,0,0.4), 0 0 20px rgba(59,130,246,0.3)',
                  }}
                >
                  <svg className="h-5 w-5 text-white transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12H16M8 12L5 9M8 12L5 15M16 12L19 9M16 12L19 15" />
                  </svg>
                </div>
              </div>

              {/* === GLASS PILL LABELS === */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={frameInView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...spring, delay: 0.6 }}
                className="pointer-events-none absolute left-4 top-4 z-10 rounded-full border border-black/10 bg-white/90 px-4 py-1.5 shadow-sm backdrop-blur-md md:left-6 md:top-6"
              >
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-black/70">.docx</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={frameInView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...spring, delay: 0.7 }}
                className="pointer-events-none absolute right-4 top-4 z-10 rounded-full border border-accent/20 bg-black/70 px-4 py-1.5 shadow-sm backdrop-blur-md md:right-6 md:top-6"
              >
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-accent/80">PagePerfect</span>
              </motion.div>
            </div>
          </motion.div>

          {/* === CALLOUT ANNOTATIONS === */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={frameInView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...spring, delay: 0.8 }}
            className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3 md:mt-10"
          >
            {CALLOUTS.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 15 }}
                animate={frameInView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...spring, delay: 0.85 + i * 0.1 }}
                className="text-center"
              >
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-accent/40">
                  {item.label}
                </div>
                <p className="text-sm leading-relaxed text-white/25">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ===== Left panel: ugly Word document (fixed 1600×1000) ===== */
function WordDocPanel() {
  return (
    <div className="flex h-[1000px] w-[1600px] flex-col bg-[#f5f5f5]">
      {/* Compact window chrome — single row */}
      <div className="flex items-center gap-2 border-b border-black/10 bg-[#e8e8e8] px-6 py-2">
        <div className="h-[8px] w-[8px] rounded-full bg-[#ff5f57]" />
        <div className="h-[8px] w-[8px] rounded-full bg-[#febc2e]" />
        <div className="h-[8px] w-[8px] rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-[14px] text-black/30">manuscript-final-FINAL-v3.docx</span>
        <div className="flex-1" />
        {/* Inline toolbar skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-[4px] w-[30px] rounded-sm bg-black/[0.07]" />
          <div className="h-[4px] w-[24px] rounded-sm bg-black/[0.07]" />
          <div className="h-[4px] w-[36px] rounded-sm bg-black/[0.07]" />
        </div>
      </div>

      {/* Page content */}
      <div className="flex flex-1 items-start justify-center overflow-hidden bg-[#dcdcdc] px-16 py-12">
        <div className="w-full max-w-[720px] bg-white p-16 shadow-md">
          {/* Ruler bar */}
          <div className="mb-6 flex items-center gap-px">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex-1 border-b border-black/[0.06]">
                <div className="mx-auto h-[5px] w-px bg-black/[0.08]" />
              </div>
            ))}
          </div>

          <div className="mb-8 text-[26px] font-bold uppercase text-black/70" style={{ fontFamily: 'Times New Roman, serif' }}>
            CHAPTER ONE
          </div>
          <div className="space-y-5 text-[18px] leading-[1.5] text-black/60" style={{ fontFamily: 'Times New Roman, serif' }}>
            <p>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>The morning light filtered through the old windows of the library, casting long shadows across the worn wooden desk where she&apos;d spent every morning for the past three years.&nbsp;&nbsp;The coffee had gone cold again.
            </p>
            <p>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>She picked up the manuscript — three hundred pages of her life&apos;s work, still{' '}
              <span style={{ textDecoration: 'underline wavy #ef4444', textDecorationThickness: '1px', textUnderlineOffset: '3px' }}>
                unfinished
              </span>
              ,&nbsp;still demanding&nbsp;more. The margins were wrong.&nbsp;&nbsp;The font was wrong. Everything about this document screamed &ldquo;
              <span style={{ textDecoration: 'underline wavy #ef4444', textDecorationThickness: '1px', textUnderlineOffset: '3px' }}>
                amateur
              </span>
              .&rdquo;
            </p>
            <p>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>But today would be different.&nbsp;&nbsp;Today she&apos;d found something that could change everything — a tool that understood what a real book should look like.
            </p>
          </div>
          {/* Page break artifact */}
          <div className="my-6 border-t border-dashed border-black/10" />
          <div className="space-y-3">
            <div className="h-[3px] w-[70%] bg-black/5" />
            <div className="h-[3px] w-[85%] bg-black/5" />
            <div className="h-[3px] w-[55%] bg-black/5" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===== Right panel: beautifully typeset PagePerfect PDF (fixed 1600×1000) ===== */
function TypesetPanel() {
  return (
    <div className="flex h-[1000px] w-[1600px] flex-col bg-[#1e1e24]">
      {/* PDF viewer bar */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-[#161619] px-8 py-3">
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        </svg>
        <span className="font-mono text-[14px] text-white/30">manuscript — PagePerfect.pdf</span>
        <div className="flex-1" />
        <span className="font-mono text-[12px] text-white/20">100%</span>
      </div>

      {/* Typeset page */}
      <div className="flex flex-1 items-start justify-center overflow-hidden px-16 py-12">
        <div
          className="w-full max-w-[720px] bg-[#fafaf5] px-[12%] py-[8%]"
          style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.3), inset 0 1px 4px rgba(0,0,0,0.06)' }}
        >
          {/* Running header */}
          <p className="mb-8 text-center font-mono text-[8px] uppercase tracking-[0.4em] text-black/15">
            The Morning Light
          </p>

          {/* Chapter heading */}
          <div className="mb-10 text-center">
            <p className="font-mono text-[12px] uppercase tracking-[0.35em] text-black/25">
              Chapter One
            </p>
            <h3 className="mt-2 text-[30px] font-normal tracking-wide text-black/70" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              The Beginning
            </h3>
            <div className="mx-auto mt-3 h-px w-16 bg-gradient-to-r from-transparent via-black/15 to-transparent" />
          </div>

          {/* Body with drop cap */}
          <div className="text-[16px] leading-[1.9] text-black/50" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <span className="float-left mr-2 mt-[2px] text-[56px] font-normal leading-[0.8] text-black/60" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              T
            </span>
            he morning light filtered through the old windows of the library, casting long shadows across the worn wooden desk where she had spent every morning for the past three years. The coffee had gone cold again.

            <p className="mt-3.5">
              She picked up the manuscript&thinsp;&mdash;&thinsp;three hundred pages of her life&rsquo;s work, still unfinished, still demanding more. The margins were wrong. The font was wrong. Everything about this document screamed &ldquo;amateur.&rdquo;
            </p>
            <p className="mt-3.5">
              But today would be different. Today she had found something that could change everything&thinsp;&mdash;&thinsp;a tool that understood what a real book should look like.
            </p>
            <p className="mt-3.5">
              She opened her laptop, pasted the text, and pressed compile. What came back was not a document. It was a book.
            </p>
          </div>

          {/* Refined folio */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-black/10" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-black/20">7</span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-black/10" />
          </div>
        </div>
      </div>
    </div>
  )
}
