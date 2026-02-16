'use client'

import { useRef, useCallback, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

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

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set((clientX - rect.left) / rect.width)
    mouseY.set((clientY - rect.top) / rect.height)
  }, [mouseX, mouseY])

  const resetPosition = useCallback(() => {
    mouseX.set(0.5)
    mouseY.set(0.5)
  }, [mouseX, mouseY])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    updatePosition(e.clientX, e.clientY)
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    const touch = e.touches[0]
    if (touch) {
      updatePosition(touch.clientX, touch.clientY)
    }
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetPosition}
      onTouchMove={handleTouchMove}
      onTouchEnd={resetPosition}
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
