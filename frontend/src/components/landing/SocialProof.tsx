'use client'

import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { FileText, Ruler, Zap, Gift } from 'lucide-react'

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 }

type StatDef = {
  numericValue?: number
  displayValue: string
  suffix?: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const STATS: StatDef[] = [
  { numericValue: 8, displayValue: '8', label: 'Professional Templates', icon: FileText },
  { numericValue: 11, displayValue: '11', label: 'Standard Page Sizes', icon: Ruler },
  { displayValue: '<2s', label: 'Average Compile', icon: Zap },
  { displayValue: 'Free', label: 'No Account Needed', icon: Gift },
]

function AnimatedNumber({ value, inView }: { value: number; inView: boolean }) {
  const motionVal = useMotionValue(0)
  const rounded = useTransform(motionVal, (v) => Math.round(v))

  useEffect(() => {
    if (inView) {
      animate(motionVal, value, { duration: 1.2, ease: [0.25, 0.4, 0.25, 1] })
    }
  }, [inView, value, motionVal])

  return <motion.span>{rounded}</motion.span>
}

export function SocialProof() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <section className="relative z-20 w-full border-y border-white/[0.06] bg-white/[0.015]">
      {/* Subtle horizontal glow line at top edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/10 to-transparent" />

      <div ref={ref} className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-y-12 py-12 md:grid-cols-4 md:gap-y-0 md:py-14">
          {STATS.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...spring, delay: i * 0.1 }}
                className="group relative flex flex-col items-center justify-center border-white/[0.06] md:border-l md:first:border-l-0"
              >
                {/* Hover glow */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.06] blur-2xl" />
                </div>

                {/* Icon */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ ...spring, delay: i * 0.1 + 0.15 }}
                  className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/[0.06]"
                >
                  <Icon className="h-3.5 w-3.5 text-accent/60" />
                </motion.div>

                {/* The Number */}
                <div className="mb-1.5 font-display text-4xl font-bold tracking-tighter sm:text-5xl">
                  <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                    {stat.numericValue != null ? (
                      <AnimatedNumber value={stat.numericValue} inView={inView} />
                    ) : (
                      stat.displayValue
                    )}
                    {stat.suffix && stat.suffix}
                  </span>
                </div>

                {/* The Label */}
                <div className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-white/30 transition-colors duration-300 group-hover:text-accent/50">
                  {stat.label}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
