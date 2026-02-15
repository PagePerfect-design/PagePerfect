'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] w-full items-center justify-center overflow-hidden bg-[#050507] px-6 pt-20 lg:pt-0">

      {/* 1. THE GRID LAYOUT */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">

        {/* LEFT COLUMN: Typography (The Promise) */}
        <div className="relative z-20 flex flex-col items-start text-left">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-gray-300 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
            </span>
            Free to use — no account needed
          </motion.div>

          {/* Headline */}
          <h1 className="font-display text-6xl font-bold tracking-tighter text-white sm:text-7xl lg:text-[7rem] leading-[0.9]">
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="block"
            >
              Paste text.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="block bg-gradient-to-r from-blue-400 via-blue-200 to-white bg-clip-text text-transparent"
            >
              Get a book.
            </motion.span>
          </h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 max-w-lg text-lg font-light leading-relaxed text-gray-400"
          >
            Professional typesetting in your browser.
            <br />
            Turn your manuscript into a print-ready PDF in seconds.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Link
              href="/app"
              className="group relative flex h-14 items-center gap-3 rounded-full bg-white px-8 text-lg font-semibold text-black transition-transform hover:scale-105"
            >
              <span>Open Editor</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="#how-it-works"
              className="flex h-14 items-center gap-2 rounded-full border border-white/10 px-8 text-sm font-medium text-white transition-colors hover:bg-white/5"
            >
              See how it works
            </Link>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: The Asset (The Magic) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-10 mt-12 h-[400px] w-full lg:mt-0 lg:h-[600px]"
        >
          {/* THE MASKING MAGIC: This gradient fades the image edges into the background */}
          <div className="relative h-full w-full [mask-image:linear-gradient(to_bottom,black_20%,transparent_100%),linear-gradient(to_left,black_20%,transparent_100%)]">
            <Image
              src="/images/hero-book-laptop.webp"
              alt="Digital to Physical Transformation"
              fill
              className="object-cover object-center lg:object-left"
              priority
            />
            {/* Overlay to tint slightly darker to match the site */}
            <div className="absolute inset-0 bg-black/20 mix-blend-multiply" />
          </div>

          {/* Ambient Glow behind the image */}
          <div className="absolute inset-0 -z-10 rounded-full bg-blue-600/20 blur-[100px]" />
        </motion.div>
      </div>
    </section>
  )
}
