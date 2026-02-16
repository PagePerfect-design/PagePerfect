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

  // Image layer — moves slowly (parallax base)
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 80])

  // Text layers — each at a different speed for depth separation
  const badgeY = useTransform(scrollYProgress, [0, 0.5], [0, 20])
  const badgeOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])

  const headlineY = useTransform(scrollYProgress, [0, 0.5], [0, 35])
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0])

  const subheadY = useTransform(scrollYProgress, [0, 0.5], [0, 50])
  const subheadOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])

  const ctaY = useTransform(scrollYProgress, [0, 0.5], [0, 60])
  const ctaOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0])

  // Ambient glow drifts independently
  const glowScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.3])

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen w-full items-center overflow-hidden bg-[#050507] pt-20 lg:pt-0"
    >

      {/* 1. THE IMAGE — Full-width container, dissolve controlled entirely by gradient masks */}
      <motion.div
        style={{ y: imageY }}
        className="absolute inset-0 z-0"
      >
        <div className="relative h-full w-full will-change-transform">

          {/* A. The Image (Scaled 120% & Pushed off edges) */}
          <div className="absolute left-[35%] top-[-10%] bottom-[-10%] right-[-10%] h-[120%]">
            <Image
              src="/images/hero-book-laptop.webp"
              alt="Background Texture"
              fill
              className="object-cover opacity-60 object-center"
              style={{
                filter: 'grayscale(100%) contrast(1.2) brightness(0.6)',
              }}
              priority
            />
          </div>

          {/* B. The Color Grade — forces electric blue via color-dodge */}
          <div className="absolute inset-0 bg-blue-900/40 mix-blend-color-dodge" />

          {/* C. The Dissolve Masks — wide multi-stop fade, no hard edges */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, #050507 0%, #050507 25%, rgba(5,5,7,0.85) 40%, rgba(5,5,7,0.4) 60%, transparent 80%)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-[#050507]/40" />
        </div>
      </motion.div>

      {/* 2. THE TYPOGRAPHY (Raised above the image) */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pointer-events-none">
        {/* Ambient glow orb behind typography — scales on scroll */}
        <motion.div
          style={{ scale: glowScale }}
          className="pointer-events-none absolute -left-20 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(59,130,246,0.08)_0%,transparent_70%)]"
        />

        <div className="max-w-3xl pointer-events-auto">

          {/* Badge — entrance: slide from left | parallax: fastest fade */}
          <motion.div
            style={{ y: badgeY, opacity: badgeOpacity }}
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease }}
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
          </motion.div>

          {/* H1 — entrance: blur-to-sharp rack focus | parallax: medium speed */}
          <motion.div style={{ y: headlineY, opacity: headlineOpacity }}>
            <motion.h1
              initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, delay: 0.15, ease }}
              className="headline-glow font-display mb-8 text-7xl font-bold leading-[0.85] tracking-tighter text-white sm:text-8xl lg:text-[8rem]"
            >
              <span className="block text-white">Paste text.</span>
              <span className="block bg-gradient-to-r from-blue-400 via-blue-200 to-purple-300 bg-clip-text text-transparent">
                Get a book.
              </span>
            </motion.h1>
          </motion.div>

          {/* Subhead — entrance: staggered fade up | parallax: slower */}
          <motion.div style={{ y: subheadY, opacity: subheadOpacity }}>
            <motion.p
              initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, delay: 0.35, ease }}
              className="mb-10 max-w-xl border-l-2 border-blue-500/50 pl-6 font-body text-xl font-light leading-relaxed tracking-tight text-gray-400"
            >
              Stop fighting Word. We turn your raw manuscript into{' '}
              <span className="font-medium text-white">precision typography</span>{' '}
              and print-ready PDFs.
            </motion.p>
          </motion.div>

          {/* CTA — entrance: staggered, pill with glow | parallax: slowest */}
          <motion.div style={{ y: ctaY, opacity: ctaOpacity }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55, ease }}
              className="flex flex-col items-start gap-6"
            >
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/app"
                  className="group relative inline-flex h-14 items-center gap-3 rounded-full bg-white px-10 text-[17px] font-semibold text-[#030305] shadow-cta transition-all duration-300 hover:scale-[1.03] hover:shadow-cta-hover"
                >
                  <span className="pointer-events-none absolute inset-0 -z-10 animate-glow-breathe rounded-full bg-white/20 blur-xl" />
                  <span>Start Formatting</span>
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                </Link>

                <Link
                  href="#how-it-works"
                  className="flex h-14 items-center px-8 text-sm font-medium uppercase tracking-widest text-gray-400 transition-colors hover:text-white"
                >
                  How it works
                </Link>
              </div>

              <p className="font-mono text-[13px] text-white/15">
                No account required &middot; Works in any browser
              </p>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
