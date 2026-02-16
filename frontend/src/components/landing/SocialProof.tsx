'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const ease = [0.25, 0.4, 0.25, 1] as const

/**
 * Colophon — Library Catalog Card
 *
 * Not "social proof." Metadata. A single horizontal line,
 * below it four columns of monospace data. Like a printer's
 * registration sheet or a library catalog card.
 *
 * Treats the user as an intelligent peer, not a lead.
 */

const METADATA = [
  { label: 'Version', value: '2.0' },
  { label: 'Output', value: 'PDF/X-1a' },
  { label: 'Engine', value: 'XeLaTeX' },
  { label: 'Templates', value: '8' },
  { label: 'Page Sizes', value: '11' },
  { label: 'Status', value: 'Online' },
]

export function SocialProof() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-20px' })

  return (
    <section className="colophon relative z-20 w-full">
      <div ref={ref} className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4 py-5">
          {METADATA.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.06, ease }}
              className="flex items-center gap-3"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/20">
                {item.label}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/50">
                {item.value}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
