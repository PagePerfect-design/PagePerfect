'use client'

import { useEffect, useState } from 'react'

const CHAPTERS = [
  { id: 'cover', label: 'Front matter' },
  { id: 'ch-i', label: 'I · The Problem' },
  { id: 'ch-ii', label: 'II · The Comparison' },
  { id: 'ch-iii', label: 'III · The Templates' },
  { id: 'ch-iv', label: 'IV · The Engine' },
  { id: 'ch-v', label: 'V · The Terms' },
  { id: 'ch-vi', label: 'VI · The Action' },
] as const

export function ManifestoFolio() {
  const [active, setActive] = useState<string>(CHAPTERS[0].id)

  useEffect(() => {
    const els = CHAPTERS
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => el !== null)

    if (els.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top that is still intersecting.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    )

    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const activeChapter = CHAPTERS.find((c) => c.id === active) ?? CHAPTERS[0]

  return (
    <aside
      aria-hidden="true"
      className="pointer-events-none fixed left-6 top-1/2 z-30 hidden -translate-y-1/2 select-none lg:block"
    >
      <div className="flex flex-col gap-2">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#111111]/55">
          Vol. I · Issue 01
        </p>
        <div
          role="status"
          aria-live="polite"
          className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#111111] transition-opacity duration-200"
        >
          {activeChapter.label}
        </div>
      </div>
    </aside>
  )
}
