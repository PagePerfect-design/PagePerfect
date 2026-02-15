'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import { useRef } from 'react'

export function HeroImage() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  // Parallax: image moves slower than scroll, creating depth
  const y = useTransform(scrollYProgress, [0, 1], [0, 120])
  const rotateX = useTransform(scrollYProgress, [0, 1], [0, 12])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 80, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1.0, duration: 1.4, ease: [0.25, 0.4, 0.25, 1] }}
      className="relative z-10 mx-auto mt-20 w-full max-w-4xl perspective-1000"
    >
      <motion.div style={{ y, rotateX, opacity }}>
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
      </motion.div>
    </motion.div>
  )
}
