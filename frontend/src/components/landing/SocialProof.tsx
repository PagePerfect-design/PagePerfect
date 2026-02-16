'use client'

import { motion } from 'framer-motion'

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 }

const STATS = [
  { value: '8', label: 'Professional Templates' },
  { value: '11', label: 'Standard Page Sizes' },
  { value: '0s', label: 'Server Latency' },
  { value: 'Free', label: 'No Account Needed' },
]

export function SocialProof() {
  return (
    <section className="relative z-20 w-full border-y border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-y-10 py-10 md:grid-cols-4 md:gap-y-0">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ ...spring, delay: i * 0.1 }}
              className="relative flex flex-col items-center justify-center border-white/[0.06] md:border-l md:first:border-l-0"
            >
              {/* The Number */}
              <div className="mb-2 font-display text-5xl font-bold tracking-tighter sm:text-6xl">
                <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                  {stat.value}
                </span>
              </div>

              {/* The Label */}
              <div className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-accent/60">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
