'use client'

import Image from 'next/image'
import { useRef, useEffect, useState, useCallback } from 'react'

export function HeroImage() {
  const ref = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const [mounted, setMounted] = useState(false)

  // Trigger entrance animation after mount
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const updateScrollProperties = useCallback(() => {
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const windowHeight = window.innerHeight
    // offset: ['start start', 'end start'] means:
    // progress=0 when element top hits viewport top
    // progress=1 when element bottom hits viewport top
    const totalTravel = rect.height
    const distancePastTop = -rect.top
    const progress = Math.max(0, Math.min(1, distancePastTop / totalTravel))

    // Parallax: y 0->120, rotateX 0->12, opacity 1->0 (at 0.5)
    const y = progress * 120
    const rotateX = progress * 12
    const opacity = Math.max(0, 1 - progress * 2)

    el.style.setProperty('--scroll-y', `${y}px`)
    el.style.setProperty('--scroll-rotateX', `${rotateX}deg`)
    el.style.setProperty('--scroll-opacity', `${opacity}`)
  }, [])

  useEffect(() => {
    function onScroll() {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateScrollProperties)
    }

    // Initial calculation
    updateScrollProperties()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [updateScrollProperties])

  return (
    <div
      ref={ref}
      className="relative z-10 mx-auto mt-20 w-full max-w-4xl perspective-1000"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted
          ? 'translateY(0) scale(1)'
          : 'translateY(80px) scale(0.96)',
        transition: 'opacity 1.4s cubic-bezier(0.25, 0.4, 0.25, 1) 1.0s, transform 1.4s cubic-bezier(0.25, 0.4, 0.25, 1) 1.0s',
        willChange: 'opacity, transform',
      }}
    >
      <div
        style={{
          transform: 'translateY(var(--scroll-y, 0px)) rotateX(var(--scroll-rotateX, 0deg))',
          opacity: 'var(--scroll-opacity, 1)',
          willChange: 'transform, opacity',
        }}
      >
        {/* Multi-color glow — atmosphere behind the image */}
        <div className="pointer-events-none absolute -inset-8 animate-pulse-slow rounded-full bg-gradient-to-r from-cyan-500/20 via-accent/25 to-purple-600/20 opacity-70 blur-[80px]" />

        {/* Secondary glow layer for depth */}
        <div className="pointer-events-none absolute -inset-4 animate-glow-breathe rounded-full bg-accent/10 blur-[40px]" />

        {/* The physical card container */}
        <div className="group relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/[0.08] bg-surface/50 shadow-[0_8px_60px_-15px_rgba(59,130,246,0.25),0_2px_20px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-transform duration-700 hover:scale-[1.02] hover:-rotate-1">
          {/* The image */}
          <Image
            src="/images/hero-book-laptop.webp"
            alt="A laptop transforming into an open book — digital meets print"
            fill
            priority
            className="object-cover"
          />

          {/* Edge bleed — dissolves into the void */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#030305] via-transparent to-[#030305]/20" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#030305]/30 via-transparent to-[#030305]/30" />

          {/* Glass sheen — reveals on hover */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/[0.08] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Inset vignette for depth */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_80px_rgba(0,0,0,0.6)]" />
        </div>

        {/* Ground shadow — anchors the image to 3D space */}
        <div className="pointer-events-none absolute -bottom-8 left-12 right-12 h-10 rounded-[50%] bg-black/50 blur-2xl" />
      </div>
    </div>
  )
}
