'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'

const ease = [0.25, 0.4, 0.25, 1] as const

export function Hero() {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  const imageY = useTransform(scrollYProgress, [0, 1], [0, 60])
  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0])

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100vh] w-full items-center overflow-hidden bg-[#050505]"
    >
      {/* ── THE IMAGE — right half, hard crop, no gradients ── */}
      <motion.div
        style={{ y: imageY }}
        className="absolute inset-y-0 right-0 w-full lg:w-[55%]"
      >
        <Image
          src="/images/hero-book-laptop.webp"
          alt="Professional typesetting"
          fill
          className="object-cover"
          style={{
            filter: 'grayscale(30%) contrast(1.1) brightness(0.7)',
          }}
          priority
        />
        {/* Hard left edge fade only — no ambient glow */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, #050505 0%, #050505 5%, rgba(5,5,5,0.7) 30%, rgba(5,5,5,0.1) 60%, transparent 100%)',
          }}
        />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050505] to-transparent" />
      </motion.div>

      {/* ── THE TYPOGRAPHY — left side, raised ── */}
      <motion.div
        style={{ opacity: textOpacity }}
        className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-8"
      >
        <div className="max-w-2xl pt-20 lg:pt-0">

          {/* H1 — massive, solid white. Like a book cover. */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
            className="font-display text-hero font-extrabold leading-[0.88] tracking-tighter text-white"
          >
            Paste text.
            <br />
            <span className="text-[#f2f2f0]">Get a book.</span>
          </motion.h1>

          {/* Subhead — Serif. Literary, not startup. */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease }}
            className="mt-8 max-w-lg font-body text-xl leading-relaxed text-white/50 md:text-[22px] md:leading-[1.6]"
          >
            Stop fighting Word. We turn your raw manuscript into{' '}
            <em className="text-white/80">precision typography</em>{' '}
            and print-ready PDFs.
          </motion.p>

          {/* CTA — solid registration blue. One button. Confident. */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55, ease }}
            className="mt-12 flex flex-col items-start gap-8"
          >
            <div className="flex items-center gap-6">
              <Link
                href="/app"
                className="group inline-flex h-13 items-center gap-3 bg-[#0033ff] px-10 font-display text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#2255ff]"
              >
                Start Formatting
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>

              <Link
                href="#how-it-works"
                className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/30 transition-colors hover:text-white/60"
              >
                How it works
              </Link>
            </div>

            <p className="font-mono text-[11px] text-white/15">
              No account required &middot; Works in any browser
            </p>
          </motion.div>

        </div>
      </motion.div>
    </section>
  )
}
