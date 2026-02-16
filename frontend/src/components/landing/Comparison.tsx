'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'

const ease = [0.25, 0.4, 0.25, 1] as const

const VIRTUAL_W = 1600
const VIRTUAL_H = 1000

export function Comparison() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '-60px' })

  const [sliderPos, setSliderPos] = useState(40)
  const [isDragging, setIsDragging] = useState(false)
  const [frameWidth, setFrameWidth] = useState(0)

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
    <section ref={sectionRef} className="relative py-32 md:py-44">
      <div className="relative mx-auto max-w-7xl px-6 md:px-8">

        {/* ── HEADER — editorial, left-aligned ── */}
        <div className="mb-16 max-w-2xl md:mb-20">
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, ease }}
            className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40"
          >
            Fig. 1 &mdash; Before &amp; After
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="font-display text-display-lg font-extrabold leading-[0.9] tracking-tighter text-white"
          >
            Same words.<br />
            Different book.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="mt-6 max-w-lg font-body text-lg leading-relaxed text-white/55"
          >
            On the left, a manuscript trapped in Word. On the right,{' '}
            <em className="text-white/75">the same text, typeset.</em>
          </motion.p>
        </div>

        {/* ── COMPARISON FRAME — crop marks, not glass ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3, ease }}
        >
          <div
            ref={containerRef}
            className="relative mx-auto aspect-[16/10] max-w-5xl cursor-ew-resize select-none overflow-hidden border border-white/[0.08]"
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

            {/* ── DIVIDER — solid line, registration blue ── */}
            <div
              className="absolute top-0 bottom-0 z-10 w-px bg-[#0033ff]"
              style={{ left: `${sliderPos}%` }}
            />

            {/* ── DRAG HANDLE ── */}
            <div
              role="slider"
              tabIndex={0}
              aria-label="Comparison slider"
              aria-valuenow={Math.round(sliderPos)}
              aria-valuemin={0}
              aria-valuemax={100}
              onKeyDown={handleKeyDown}
              className="absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 outline-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="flex h-10 w-10 items-center justify-center border border-[#0033ff] bg-[#050505] transition-colors hover:bg-[#0033ff]/10">
                <svg className="h-4 w-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12H16M8 12L5 9M8 12L5 15M16 12L19 9M16 12L19 15" />
                </svg>
              </div>
            </div>
          </div>

          {/* ── FIGURE CAPTIONS — outside the frame, textbook style ── */}
          <div className="mx-auto flex max-w-5xl justify-between px-0 pt-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
              .docx — Microsoft Word
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
              .pdf — PagePerfect
            </span>
          </div>
        </motion.div>

        {/* ── ANNOTATION — clean grid, no glass ── */}
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
          {[
            { label: 'Margins', desc: 'Golden-ratio proportions replace cramped Word defaults' },
            { label: 'Typography', desc: 'Baseline grid locks every line to a consistent rhythm' },
            { label: 'Structure', desc: 'Drop caps, em-dashes, and proper chapter openings' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1, ease }}
            >
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.15em] text-white/50">
                {item.label}
              </p>
              <p className="font-body text-sm leading-relaxed text-white/45">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ===== Left panel: Word document ===== */
function WordDocPanel() {
  return (
    <div className="flex h-[1000px] w-[1600px] flex-col bg-[#f5f5f5]">
      <div className="flex items-center gap-2 border-b border-black/10 bg-[#e8e8e8] px-6 py-2">
        <div className="h-[8px] w-[8px] rounded-full bg-[#ff5f57]" />
        <div className="h-[8px] w-[8px] rounded-full bg-[#febc2e]" />
        <div className="h-[8px] w-[8px] rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-[14px] text-black/30">manuscript-final-FINAL-v3.docx</span>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-hidden bg-[#dcdcdc] px-16 py-12">
        <div className="w-full max-w-[720px] bg-white p-16 shadow-md">
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

/* ===== Right panel: typeset PDF ===== */
function TypesetPanel() {
  return (
    <div className="flex h-[1000px] w-[1600px] flex-col bg-[#1a1a1a]">
      <div className="flex items-center gap-3 border-b border-white/10 bg-[#111111] px-8 py-3">
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        </svg>
        <span className="font-mono text-[14px] text-white/30">manuscript — PagePerfect.pdf</span>
        <div className="flex-1" />
        <span className="font-mono text-[12px] text-white/20">100%</span>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-hidden px-16 py-12">
        <div
          className="w-full max-w-[720px] bg-[#fafaf5] px-[12%] py-[8%]"
          style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.3)' }}
        >
          <p className="mb-8 text-center font-mono text-[8px] uppercase tracking-[0.4em] text-black/15">
            The Morning Light
          </p>

          <div className="mb-10 text-center">
            <p className="font-mono text-[12px] uppercase tracking-[0.35em] text-black/25">
              Chapter One
            </p>
            <h3 className="mt-2 text-[30px] font-normal tracking-wide text-black/70" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              The Beginning
            </h3>
            <div className="mx-auto mt-3 h-px w-16 bg-black/10" />
          </div>

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

          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-black/8" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-black/20">7</span>
            <div className="h-px w-8 bg-black/8" />
          </div>
        </div>
      </div>
    </div>
  )
}
