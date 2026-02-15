'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] w-full items-center justify-center overflow-hidden bg-[#050507] px-6">

      {/* 1. ATMOSPHERIC GLOW (Behind everything) */}
      <div className="absolute top-0 right-0 h-[800px] w-[800px] pointer-events-none rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">

        {/* LEFT: Typography */}
        <div className="relative z-20 flex flex-col items-start text-left pt-20 lg:pt-0">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-blue-200 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
            </span>
            V2.0 LIVE
          </motion.div>

          <h1 className="font-display text-7xl font-bold tracking-tighter text-white sm:text-8xl lg:text-[7.5rem] leading-[0.85]">
            Paste text.
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-white/60 bg-clip-text text-transparent">
              Get a book.
            </span>
          </h1>

          <p className="mt-8 max-w-md border-l border-white/10 pl-6 text-lg font-light leading-relaxed text-gray-400">
            Stop fighting Word. Turn your manuscript into a{' '}
            <span className="text-white">print-ready PDF</span>{' '}
            that looks like it came from a publishing house.
          </p>

          <div className="mt-10 flex gap-4">
            <Link
              href="/app"
              className="group relative flex h-14 items-center gap-3 rounded-full bg-white px-8 text-lg font-semibold text-black transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)]"
            >
              <span>Start Formatting</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* RIGHT: The Image (Color Graded) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative z-10 -mr-20 h-[500px] w-full lg:-mr-40 lg:h-[700px]"
        >

          {/* THE IMAGE CONTAINER */}
          <div className="relative h-full w-full">

            {/* 1. The Image with FILTERS to kill the 'Stock Blue' */}
            <Image
              src="/images/hero-book-laptop.webp"
              alt="Book transformation"
              fill
              className="object-cover object-center"
              style={{
                filter: 'brightness(0.8) contrast(1.2) saturate(1.2) hue-rotate(-10deg)',
              }}
              priority
            />

            {/* 2. THE VIGNETTE MASK (Hides the edges) */}
            <div
              className="absolute inset-0 bg-[#050507]"
              style={{
                maskImage: 'radial-gradient(circle at center, transparent 40%, black 100%)',
                WebkitMaskImage: 'radial-gradient(circle at center, transparent 40%, black 100%)',
              }}
            />

            {/* 3. THE GRADIENT OVERLAY (Tints the image to your brand) */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-transparent opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-l from-[#050507] via-transparent to-transparent opacity-80" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
