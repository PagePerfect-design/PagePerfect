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
  const y = useTransform(scrollYProgress, [0, 1], [0, 100])
  const rotateX = useTransform(scrollYProgress, [0, 1], [0, 10])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0, duration: 1.2, ease: [0.25, 0.4, 0.25, 1] }}
      className="relative z-10 mx-auto mt-16 w-full max-w-4xl perspective-1000"
    >
      <motion.div style={{ y, rotateX, opacity }}>
        {/* The colored glow — atmosphere behind the image */}
        <div className="pointer-events-none absolute -inset-4 animate-pulse-slow rounded-full bg-gradient-to-r from-accent/30 to-purple-600/30 opacity-70 blur-[60px]" />

        {/* The physical card container */}
        <div className="group relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-surface/50 shadow-2xl backdrop-blur-sm transition-transform duration-700 hover:scale-[1.02] hover:-rotate-1">
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
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Inset vignette for depth */}
          <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_80px_rgba(0,0,0,0.6)]" />
        </div>

        {/* Ground shadow — anchors the image to 3D space */}
        <div className="pointer-events-none absolute -bottom-6 left-10 right-10 h-8 rounded-[50%] bg-black/40 blur-xl" />
      </motion.div>
    </motion.div>
  )
}
