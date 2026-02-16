'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'

const ease = [0.25, 0.4, 0.25, 1] as const

/**
 * Final CTA — One sentence. One button.
 *
 * The whitespace IS the design. An entire viewport
 * with almost nothing in it. Confident restraint.
 */
export function FinalCTA() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="relative overflow-hidden py-40 text-center md:py-56">
      <div ref={ref} className="relative mx-auto max-w-3xl px-6 md:px-8">

        {/* Decorative rule */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={inView ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ duration: 0.6, ease }}
          className="mx-auto mb-20 h-px w-20 origin-center bg-white/[0.1]"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          className="mb-6 font-mono text-[11px] uppercase tracking-[0.15em] text-white/20"
        >
          Try it now
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease }}
          className="font-display text-display-lg font-extrabold leading-[0.9] tracking-tighter text-white"
        >
          Your manuscript
          <br />
          has been waiting
          <br />
          for this.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3, ease }}
          className="mx-auto mt-8 max-w-md font-body text-xl leading-relaxed text-white/30"
        >
          Open the editor. Paste your text. See what professional typesetting actually looks like.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.45, ease }}
          className="mt-14 flex flex-col items-center gap-6"
        >
          <Link
            href="/app"
            className="group inline-flex h-14 items-center gap-3 bg-[#0033ff] px-12 font-display text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#2255ff]"
          >
            Open the Editor
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          <p className="font-mono text-[11px] text-white/15">
            No account required &middot; Free forever
          </p>
        </motion.div>
      </div>
    </section>
  )
}
