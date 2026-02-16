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
    <section data-theme="light" className="relative z-20 w-full bg-surface border-y border-border backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-y-12 py-12 md:grid-cols-4 md:gap-y-0">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ ...spring, delay: i * 0.1 }}
              className="relative flex flex-col items-center justify-center border-border md:border-l md:first:border-l-0"
            >
              {/* The Number */}
              <div className="mb-2 font-display text-5xl font-bold tracking-tighter sm:text-6xl">
                <span className="bg-gradient-to-b from-text-primary to-text-tertiary bg-clip-text text-transparent">
                  {stat.value}
                </span>
              </div>

              {/* The Label */}
              <div className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-accent/70">
                {stat.label}
              </div>

              {/* Decorative tick marks */}
              <div className="absolute left-0 top-0 h-2 w-px bg-gradient-to-b from-accent to-transparent opacity-40" />
              <div className="absolute bottom-0 right-0 h-2 w-px bg-gradient-to-t from-accent to-transparent opacity-40" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Subtle background grid */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:24px_24px]" />
    </section>
  )
}
