'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const STATS = [
  { value: '8', label: 'Professional templates' },
  { value: '11', label: 'Page sizes' },
  { value: 'Any', label: 'Browser, any OS' },
  { value: '$0', label: 'To start' },
]

export function SocialProof() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <section ref={ref} className="relative border-t border-white/[0.04] py-20 md:py-28">
      <div className="relative mx-auto max-w-5xl px-6 md:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-16">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
              className="text-center"
            >
              <div className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
                {stat.value}
              </div>
              <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-white/25">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
