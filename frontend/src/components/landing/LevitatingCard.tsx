'use client'

import { useRef, useState, useCallback, type ReactNode } from 'react'

// CSS cubic-bezier approximating spring with stiffness: 100, damping: 20
// This gives an ease-out with slight overshoot feel
const SPRING_TRANSITION = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 1.04), box-shadow 0.35s cubic-bezier(0.25, 0.46, 0.45, 1.04)'
const RESET_TRANSITION = 'transform 0.6s cubic-bezier(0.25, 0.4, 0.25, 1), box-shadow 0.6s cubic-bezier(0.25, 0.4, 0.25, 1)'

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
  const [isHovered, setIsHovered] = useState(false)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const normalX = (clientX - rect.left) / rect.width   // 0 to 1
    const normalY = (clientY - rect.top) / rect.height    // 0 to 1
    // rotateX: mouseY [0,1] -> [8,-8], rotateY: mouseX [0,1] -> [-8,8]
    const rotateX = 8 - normalY * 16
    const rotateY = -8 + normalX * 16
    setRotation({ x: rotateX, y: rotateY })
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    updatePosition(e.clientX, e.clientY)
  }, [updatePosition])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0]
    if (touch) {
      updatePosition(touch.clientX, touch.clientY)
    }
  }, [updatePosition])

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    setRotation({ x: 0, y: 0 })
  }, [])

  const handleTouchEnd = useCallback(() => {
    setIsHovered(false)
    setRotation({ x: 0, y: 0 })
  }, [])

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `perspective(800px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transformStyle: 'preserve-3d',
        boxShadow: isHovered
          ? `0 30px 80px -15px ${glowColor}`
          : `0 20px 60px -15px ${glowColor}`,
        transition: isHovered ? SPRING_TRANSITION : RESET_TRANSITION,
        willChange: 'transform',
      }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </div>
  )
}
