'use client'

import { useRef, useState, useCallback } from 'react'
import { Reveal } from './Reveal'

export function Comparison() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sliderPos, setSliderPos] = useState(40)
  const [isDragging, setIsDragging] = useState(false)

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

  // Keyboard accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setSliderPos(p => Math.max(2, p - 2))
    if (e.key === 'ArrowRight') setSliderPos(p => Math.min(98, p + 2))
  }, [])

  return (
    <section className="section-separator relative py-32 md:py-44">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.04)_0%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 md:px-8">
        <Reveal>
          <div className="mb-16 text-center md:mb-20">
            <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/20">Before &amp; After</div>
            <h2 className="text-glow headline-glow font-display text-4xl font-bold leading-[0.9] tracking-tighter text-white md:text-6xl lg:text-7xl">
              The difference is{' '}
              <span className="gradient-accent-text">visible</span>.
            </h2>
            <p className="mt-5 text-lg font-light text-white/30 md:text-xl">
              Stop fighting Word. Start publishing.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          {/* === BRUTALIST FRAME — hard lines, no rounded corners === */}
          <div
            ref={containerRef}
            className="relative mx-auto aspect-[16/10] max-w-5xl cursor-ew-resize select-none overflow-hidden border border-white/[0.08]"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* LEFT: Word Doc — ugly, cramped */}
            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
              <WordDocPanel />
            </div>

            {/* RIGHT: PagePerfect — beautiful typesetting */}
            <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}>
              <TypesetPanel />
            </div>

            {/* === THE DIVIDER — hard 1px line === */}
            <div
              className="absolute top-0 bottom-0 z-10 w-[1px]"
              style={{
                left: `${sliderPos}%`,
                background: isDragging
                  ? '#3b82f6'
                  : 'rgba(255,255,255,0.3)',
                boxShadow: isDragging
                  ? '0 0 20px 4px rgba(59,130,246,0.6), 0 0 60px 8px rgba(59,130,246,0.3)'
                  : 'none',
                transition: isDragging ? 'none' : 'box-shadow 0.3s ease',
              }}
            />

            {/* === DRAG HANDLE — brutalist square === */}
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
              <div
                className="flex h-10 w-10 items-center justify-center border transition-all duration-200"
                style={{
                  borderColor: isDragging ? '#3b82f6' : 'rgba(255,255,255,0.3)',
                  background: isDragging ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.6)',
                  boxShadow: isDragging
                    ? '0 0 30px rgba(59,130,246,0.5), 0 0 60px rgba(59,130,246,0.2)'
                    : '0 2px 8px rgba(0,0,0,0.5)',
                }}
              >
                <svg className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </div>

            {/* Floating labels — brutalist rectangles */}
            <div className="pointer-events-none absolute left-4 top-4 z-10 border border-black/10 bg-white/90 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-black backdrop-blur-sm md:left-6 md:top-6">
              .DOCX
            </div>
            <div className="pointer-events-none absolute right-4 top-4 z-10 border border-white/10 bg-black/80 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-sm md:right-6 md:top-6">
              PagePerfect
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ===== Left panel: ugly Word document ===== */
function WordDocPanel() {
  return (
    <div className="flex h-full w-full flex-col bg-[#f5f5f5]">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 border-b border-black/10 bg-[#e8e8e8] px-3 py-1.5">
        <div className="h-2 w-2 rounded-full bg-[#ff5f57]" />
        <div className="h-2 w-2 rounded-full bg-[#febc2e]" />
        <div className="h-2 w-2 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-[9px] text-black/30">manuscript-final-FINAL-v3.docx</span>
      </div>
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-3 border-b border-black/10 bg-[#f0f0f0] px-4 py-1.5">
        <div className="h-2 w-8 bg-black/10" />
        <div className="h-2 w-6 bg-black/10" />
        <div className="h-2 w-10 bg-black/10" />
        <div className="flex-1" />
        <div className="h-2 w-5 bg-black/10" />
      </div>
      {/* Page content */}
      <div className="flex flex-1 items-start justify-center overflow-hidden bg-[#dcdcdc] p-4 md:p-8">
        <div className="w-full max-w-[480px] bg-white p-6 shadow-md md:p-10">
          <div className="mb-6 text-[15px] font-bold uppercase text-black/70 md:text-xl" style={{ fontFamily: 'Times New Roman, serif' }}>
            CHAPTER ONE
          </div>
          <div className="space-y-3 text-[11px] leading-[1.5] text-black/60 md:text-[13px]" style={{ fontFamily: 'Times New Roman, serif' }}>
            <p>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>The morning light filtered through the old windows of the library, casting long shadows across the worn wooden desk where she&apos;d spent every morning for the past three years.&nbsp;&nbsp;The coffee had gone cold again.
            </p>
            <p>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>She picked up the manuscript — three hundred pages of her life&apos;s work, still unfinished,&nbsp;still demanding&nbsp;more. The margins were wrong.&nbsp;&nbsp;The font was wrong. Everything about this document screamed &ldquo;amateur.&rdquo;
            </p>
            <p>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>But today would be different.&nbsp;&nbsp;Today she&apos;d found something that could change everything — a tool that understood what a real book should look like.
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-[2px] w-[70%] bg-black/5" />
            <div className="h-[2px] w-[85%] bg-black/5" />
            <div className="h-[2px] w-[55%] bg-black/5" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===== Right panel: beautifully typeset PagePerfect PDF ===== */
function TypesetPanel() {
  return (
    <div className="flex h-full w-full flex-col bg-[#1e1e24]">
      {/* PDF viewer bar */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#161619] px-4 py-2">
        <svg className="h-3.5 w-3.5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        </svg>
        <span className="font-mono text-[9px] text-white/30">manuscript — PagePerfect.pdf</span>
        <div className="flex-1" />
        <span className="font-mono text-[8px] text-white/20">100%</span>
      </div>
      {/* Typeset page */}
      <div className="flex flex-1 items-start justify-center overflow-hidden p-4 md:p-8">
        <div className="w-full max-w-[480px] bg-[#fafaf5] px-[12%] py-[10%] shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
          {/* Chapter heading */}
          <div className="mb-6 text-center md:mb-8">
            <p className="font-mono text-[8px] uppercase tracking-[0.35em] text-black/25">
              Chapter One
            </p>
            <h3 className="mt-1.5 text-[18px] font-normal tracking-wide text-black/70 md:text-[22px]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              The Beginning
            </h3>
            <div className="mx-auto mt-2.5 h-px w-12 bg-gradient-to-r from-transparent via-black/15 to-transparent" />
          </div>

          {/* Body with drop cap */}
          <div className="text-[10px] leading-[1.9] text-black/50 md:text-[11.5px]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <span className="float-left mr-1.5 mt-[1px] text-[36px] font-normal leading-[0.8] text-black/60 md:text-[42px]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              T
            </span>
            he morning light filtered through the old windows of the library, casting long shadows across the worn wooden desk where she had spent every morning for the past three years. The coffee had gone cold again.

            <p className="mt-2.5">
              She picked up the manuscript&thinsp;&mdash;&thinsp;three hundred pages of her life&rsquo;s work, still unfinished, still demanding more. The margins were wrong. The font was wrong. Everything about this document screamed &ldquo;amateur.&rdquo;
            </p>
            <p className="mt-2.5">
              But today would be different. Today she had found something that could change everything&thinsp;&mdash;&thinsp;a tool that understood what a real book should look like.
            </p>
            <p className="mt-2.5">
              She opened her laptop, pasted the text, and pressed compile. What came back was not a document. It was a book.
            </p>
          </div>

          {/* Page number */}
          <div className="mt-6 text-center font-mono text-[7px] text-black/15 md:mt-8">
            7
          </div>
        </div>
      </div>
    </div>
  )
}
