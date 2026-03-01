'use client'

import { useRef, Children, type ReactNode } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

const EASE = [0.25, 0.4, 0.25, 1] as const

const DIRECTION_MAP = {
  up:    { y: 24, x: 0 },
  down:  { y: -24, x: 0 },
  left:  { y: 0, x: 24 },
  right: { y: 0, x: -24 },
  none:  { y: 0, x: 0 },
} as const

interface RevealProps {
  children: ReactNode
  delay?: number
  direction?: keyof typeof DIRECTION_MAP
  className?: string
  once?: boolean
}

export function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  once = true,
}: RevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, margin: '-80px' })
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  const { x, y } = DIRECTION_MAP[direction]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y, x, filter: 'blur(4px)' }}
      animate={isInView ? { opacity: 1, y: 0, x: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface RevealGroupProps {
  children: ReactNode
  staggerDelay?: number
  className?: string
  direction?: keyof typeof DIRECTION_MAP
}

export function RevealGroup({
  children,
  staggerDelay = 0.06,
  className = '',
  direction = 'up',
}: RevealGroupProps) {
  const items = Children.toArray(children)
  return (
    <div className={className}>
      {items.map((child, i) => (
        <Reveal key={i} delay={i * staggerDelay} direction={direction}>
          {child}
        </Reveal>
      ))}
    </div>
  )
}
