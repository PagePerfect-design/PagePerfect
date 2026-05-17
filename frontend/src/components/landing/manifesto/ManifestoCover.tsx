'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Reveal } from '@/components/Reveal'

export function ManifestoCover() {
  return (
    <section id="cover" aria-label="Front matter">
      {/* ─── Half-title page ────────────────────────────────────────────── */}
      <div className="relative flex min-h-[88vh] items-center justify-center border-b border-[#111111] bg-[#FDFCF8] px-6 md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal direction="up" blur={false}>
            <p className="mb-10 font-mono text-[10px] uppercase tracking-[0.2em] text-[#555555]">
              A Specimen · Vol. I · Issue 01
            </p>
          </Reveal>

          <Reveal direction="up" delay={0.1}>
            <h1
              className="font-display font-extrabold leading-[0.85] tracking-tighter text-[#111111]"
              style={{ fontSize: 'clamp(4rem, 11vw, 9rem)' }}
            >
              PagePerfect
            </h1>
          </Reveal>

          <Reveal direction="up" delay={0.2} blur={false}>
            <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.2em] text-[#555555]">
              MMXXVI · Typesetting for authors
            </p>
          </Reveal>
        </div>
      </div>

      {/* ─── Title page ─────────────────────────────────────────────────── */}
      <div className="relative grid min-h-[88vh] grid-cols-1 border-b border-[#111111] bg-[#FDFCF8] md:grid-cols-[5fr_7fr]">
        {/* Left column — title + dek + CTA */}
        <div className="relative flex flex-col justify-between px-6 py-16 md:px-12 md:py-20">
          <Reveal direction="up" blur={false}>
            <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.18em] text-[#555555]">
              By the Typesetting Engine
            </p>
          </Reveal>

          <div>
            <Reveal direction="up" delay={0.05}>
              <h2
                className="font-display font-extrabold leading-[0.85] tracking-tighter text-[#111111]"
                style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
              >
                Your book.<br />KDP-ready tonight.
              </h2>
            </Reveal>

            <Reveal direction="up" delay={0.15} blur={false}>
              <p
                className="mt-8 max-w-md font-body italic leading-[1.6] text-[#333333]"
                style={{ fontSize: '1.125rem' }}
              >
                Paste your manuscript. Pick a trim size. Get a print-compliant
                PDF that passes Amazon KDP and IngramSpark review on the first
                upload.
              </p>
            </Reveal>
          </div>

          <Reveal direction="up" delay={0.25} blur={false}>
            <div className="mt-16 flex flex-col items-start gap-4">
              <Link
                href="/app"
                className="inline-flex h-12 items-center bg-[#FF3333] px-10 font-mono text-[11px] uppercase tracking-[0.12em] text-white transition-[background-color,transform] duration-200 ease-pp hover:bg-[#E52222] active:scale-[0.97]"
              >
                Start formatting →
              </Link>
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#555555]">
                Free preview · Export from $19.99
              </p>
            </div>
          </Reveal>
        </div>

        {/* Right column — Runware cover photograph (slot) */}
        <div className="relative border-t border-[#111111] bg-[#f5f5f0] md:border-l md:border-t-0">
          <div className="relative h-full min-h-[40vh] w-full overflow-hidden">
            <Image
              src="/landing/landing-cover.webp"
              alt="Cover specimen: numeral I, red accent rule, the lead 'Markdown, precisely set.'"
              width={1408}
              height={768}
              priority
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
