'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative flex min-h-screen w-full items-center overflow-hidden bg-[#050507] pt-20 lg:pt-0">

      {/* 1. THE IMAGE (Positioned Absolutely to Break the Grid) */}
      <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[65%] z-0">
        <div className="relative h-full w-full">

          {/* A. The Image (Scaled & Pushed) */}
          <div className="absolute right-[-10%] top-[-10%] bottom-[-10%] w-[120%] h-[120%]">
            <Image
              src="/images/hero-book-laptop.webp"
              alt="Background Texture"
              fill
              className="object-cover object-left lg:object-center opacity-60"
              style={{
                filter: 'grayscale(100%) contrast(1.2) brightness(0.6)',
              }}
              priority
            />
          </div>

          {/* B. The Color Grade (The "Electric" Tint) */}
          <div className="absolute inset-0 bg-blue-900/40 mix-blend-color-dodge" />

          {/* C. The Mask (Dissolves the image into the black void) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-transparent" />
        </div>
      </div>

      {/* 2. THE TYPOGRAPHY (Raised above the image) */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pointer-events-none">
        <div className="max-w-3xl pointer-events-auto">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 inline-flex items-center gap-3 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-blue-300">
              System Live
            </span>
          </motion.div>

          {/* H1 - Massive & Overlapping */}
          <h1 className="font-display text-7xl font-bold tracking-tighter text-white sm:text-8xl lg:text-[8rem] leading-[0.85] mb-8">
            <span className="block text-white">Paste text.</span>
            <span className="block bg-gradient-to-r from-blue-400 to-white/50 bg-clip-text text-transparent">
              Get a book.
            </span>
          </h1>

          <p className="mb-10 max-w-xl border-l-2 border-blue-500/50 pl-6 text-xl font-light leading-relaxed text-gray-400">
            Stop fighting Word. We turn your raw manuscript into{' '}
            <span className="font-medium text-white">precision typography</span>{' '}
            and print-ready PDFs.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/app"
              className="group relative flex h-16 items-center gap-4 bg-white px-10 text-lg font-bold text-black transition-all hover:bg-blue-50"
            >
              <span>Start Formatting</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="#how-it-works"
              className="flex h-16 items-center px-8 text-sm font-medium uppercase tracking-widest text-gray-400 transition-colors hover:text-white"
            >
              How it works
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
