'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

// LAW 1: Everything has mass — spring physics for tilt, colored shadow bleed

const SPRING_CONFIG = { stiffness: 100, damping: 20 }

export function LevitatingCard({
  children,
  className = '',
  glowColor = 'rgba(59, 130, 246, 0.5)',
}: {
  children: ReactNode
  className?: string
  glowColor?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [8, -8]), SPRING_CONFIG)
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-8, 8]), SPRING_CONFIG)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set((e.clientX - rect.left) / rect.width)
    mouseY.set((e.clientY - rect.top) / rect.height)
  }

  function handleMouseLeave() {
    mouseX.set(0.5)
    mouseY.set(0.5)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        boxShadow: `0 20px 60px -15px ${glowColor}`,
      }}
      whileHover={{
        boxShadow: `0 30px 80px -15px ${glowColor}`,
      }}
      transition={{ type: 'spring', ...SPRING_CONFIG }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  )
}
