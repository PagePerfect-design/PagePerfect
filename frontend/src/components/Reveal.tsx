'use client'

import { useRef, useEffect, useState, Children, type ReactNode } from 'react'

const DIRECTION_MAP = {
  up:    { y: 24, x: 0 },
  down:  { y: -24, x: 0 },
  left:  { y: 0, x: 24 },
  right: { y: 0, x: -24 },
  none:  { y: 0, x: 0 },
} as const

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

interface RevealProps {
  children: ReactNode
  delay?: number
  direction?: keyof typeof DIRECTION_MAP
  className?: string
  once?: boolean
  /**
   * Apply 4px blur during the reveal. Default `true` (display-scale headlines).
   * Set `false` on small body copy (14–16px) where crispness matters and there
   * is no crossfade discontinuity to mask. Also drops `filter` from the
   * transitionProperty list to avoid paint cost on an unchanged property.
   */
  blur?: boolean
}

export function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  once = true,
  blur = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setIsInView(false)
        }
      },
      { rootMargin: '-80px', threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [once])

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  const { x, y } = DIRECTION_MAP[direction]
  const transitionProperty = blur
    ? 'opacity, transform, filter'
    : 'opacity, transform'

  const hiddenStyle: React.CSSProperties = {
    opacity: 0,
    transform: `translate(${x}px, ${y}px)`,
    ...(blur ? { filter: 'blur(4px)' } : null),
    transitionProperty,
    transitionDelay: `${delay}s`,
  }

  const visibleStyle: React.CSSProperties = {
    opacity: 1,
    transform: 'translate(0px, 0px)',
    ...(blur ? { filter: 'blur(0px)' } : null),
    transitionProperty,
    transitionDelay: `${delay}s`,
  }

  return (
    <div
      ref={ref}
      className={`duration-700 ease-[cubic-bezier(0.25,0.4,0.25,1)] ${className}`}
      style={isInView ? visibleStyle : hiddenStyle}
    >
      {children}
    </div>
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
