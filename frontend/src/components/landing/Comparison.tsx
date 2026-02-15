'use client'

import Image from 'next/image'
import { ReactCompareSlider } from 'react-compare-slider'
import { Reveal } from './Reveal'

/* ---------- Left side: Ugly Word doc ---------- */
function WordDocPanel() {
  return (
    <div className="flex h-full w-full flex-col bg-[#f5f5f5]">
      {/* Fake Word toolbar ribbon */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 bg-[#e8e8e8] px-3 py-1.5">
        <div className="h-2 w-2 rounded-full bg-[#ff5f57]" />
        <div className="h-2 w-2 rounded-full bg-[#febc2e]" />
        <div className="h-2 w-2 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-[9px] text-gray-400">manuscript-final-FINAL-v3.docx</span>
      </div>
      {/* Fake toolbar */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-[#f8f8f8] px-4 py-1.5">
        <div className="h-2 w-8 rounded-sm bg-gray-300" />
        <div className="h-2 w-6 rounded-sm bg-gray-300" />
        <div className="h-2 w-10 rounded-sm bg-gray-300" />
        <div className="h-px flex-1" />
        <div className="h-2 w-5 rounded-sm bg-gray-300" />
      </div>
      {/* Bad page content */}
      <div className="flex flex-1 items-start justify-center overflow-hidden bg-[#e0e0e0] p-4 md:p-8">
        <div className="w-full max-w-[480px] bg-white p-6 shadow-md md:p-10">
          <div className="mb-6 font-sans text-[15px] font-bold uppercase text-gray-800 md:text-xl">
            CHAPTER ONE
          </div>
          <div className="space-y-3 font-serif text-[11px] leading-[1.5] text-gray-700 md:text-[13px]">
            <p>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>The morning light filtered through the old windows of the library, casting long shadows across the worn wooden desk where she&apos;d spent every morning for the past three years.&nbsp;&nbsp;The coffee had gone cold again.
            </p>
            <p>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>She picked up the manuscript — three hundred pages of her life&apos;s work, still unfinished,&nbsp;still demanding&nbsp;more. The margins were wrong.&nbsp;&nbsp;The font was wrong. Everything about this document screamed &ldquo;amateur.&rdquo;
            </p>
            <p>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>But today would be different.&nbsp;&nbsp;Today she&apos;d found something that could change everything — a tool that understood what a real book should look like.
            </p>
            <p>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>She opened her laptop, pasted the text, and pressed compile.&nbsp;&nbsp;What came back was not a document.&nbsp;&nbsp;It was a book.
            </p>
          </div>
          {/* Placeholder lines */}
          <div className="mt-4 space-y-2">
            <div className="h-[2px] w-[70%] rounded bg-gray-200" />
            <div className="h-[2px] w-[85%] rounded bg-gray-200" />
            <div className="h-[2px] w-[55%] rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Right side: Beautiful typeset PDF ---------- */
function TypesetPanel() {
  return (
    <div className="flex h-full w-full flex-col bg-[#2a2a32]">
      {/* Fake PDF viewer bar */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#1e1e24] px-4 py-2">
        <svg className="h-3.5 w-3.5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        </svg>
        <span className="font-mono text-[9px] text-gray-400">manuscript — PagePerfect.pdf</span>
        <div className="flex-1" />
        <span className="font-mono text-[8px] text-gray-500">100%</span>
      </div>
      {/* Beautiful typeset page */}
      <div className="flex flex-1 items-start justify-center overflow-hidden p-4 md:p-8">
        <div className="w-full max-w-[480px] bg-[#fafaf8] px-[12%] py-[10%] shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
          {/* Chapter heading */}
          <div className="mb-6 text-center md:mb-8">
            <p className="font-mono text-[8px] uppercase tracking-[0.35em] text-neutral-400">
              Chapter One
            </p>
            <h3 className="mt-1.5 text-[18px] font-normal tracking-wide text-neutral-800 md:text-[22px]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              The Beginning
            </h3>
            <div className="mx-auto mt-2.5 h-px w-12 bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
          </div>

          {/* Body text with drop cap */}
          <div className="text-[10px] leading-[1.9] text-neutral-600 md:text-[11.5px]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <span className="float-left mr-1.5 mt-[1px] text-[36px] font-normal leading-[0.8] text-neutral-800 md:text-[42px]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
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
          <div className="mt-6 text-center font-mono text-[7px] text-neutral-300 md:mt-8">
            7
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Glowing handle ---------- */
function GlowingHandle() {
  return (
    <div className="group flex h-full cursor-ew-resize items-center justify-center">
      {/* Glowing line */}
      <div className="h-full w-[2px] bg-accent shadow-[0_0_24px_4px_rgba(59,130,246,0.5)]" />
      {/* Handle circle */}
      <div className="absolute flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-accent shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-transform group-hover:scale-110">
        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      </div>
    </div>
  )
}

/* ---------- Main Section ---------- */
export function Comparison() {
  return (
    <section className="section-separator relative py-32 md:py-44">
      {/* Background texture */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/images/books-scattered.webp"
          alt=""
          fill
          className="object-cover opacity-[0.04]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface via-transparent to-surface" />
      </div>

      {/* Background glow — more intense */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[1000px] -translate-x-1/2 -translate-y-1/2 bg-glow-radial opacity-50" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 md:px-8">
        <Reveal>
          <div className="mb-16 text-center md:mb-20">
            <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-accent/50">Before & After</div>
            <h2 className="font-display text-4xl font-bold tracking-tighter text-white md:text-6xl lg:text-7xl">
              The difference is{' '}
              <span className="gradient-accent-text">visible</span>.
            </h2>
            <p className="mt-5 text-lg font-light text-white/40 md:text-xl">
              Stop fighting Word. Start publishing.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          {/* Slider frame with glow border */}
          <div className="relative mx-auto aspect-[16/10] max-w-5xl overflow-hidden rounded-2xl border border-white/[0.08] shadow-[0_8px_60px_-15px_rgba(59,130,246,0.15),0_2px_20px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
            <ReactCompareSlider
              itemOne={<WordDocPanel />}
              itemTwo={<TypesetPanel />}
              handle={<GlowingHandle />}
              position={40}
            />

            {/* Floating labels */}
            <div className="pointer-events-none absolute left-6 top-14 rounded-full border border-black/10 bg-white/90 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-black shadow-sm backdrop-blur-md">
              Original .DOCX
            </div>
            <div className="pointer-events-none absolute right-6 top-14 rounded-full border border-white/10 bg-black/80 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm backdrop-blur-md">
              PagePerfect PDF
            </div>

            {/* Vignette overlay */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
