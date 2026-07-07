'use client'

import { useRef, useEffect, useState, Children, type ReactNode } from 'react'

const DIRECTION_MAP = {
  up:    { y: 16, x: 0 },
  down:  { y: -16, x: 0 },
  left:  { y: 0, x: 16 },
  right: { y: 0, x: -16 },
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
  // 'ssr'    — pre-hydration: rendered fully visible so first paint (and no-JS,
  //            and search engines) always show content. LCP never waits on JS.
  // 'hidden' — below the fold after hydration, awaiting scroll into view
  // 'shown'  — revealed (transitions from 'hidden')
  const [state, setState] = useState<'ssr' | 'hidden' | 'shown'>('ssr')
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Reveal once the element's top edge has crossed into the viewport (with a
    // small bottom inset so tall blocks begin as soon as they appear). Uses a
    // live measurement, so instant jumps — anchor links, End key, find-in-page,
    // scroll restoration — all reveal correctly, unlike an IntersectionObserver
    // whose entry callback can be missed on a teleporting scroll.
    const inView = () => ref.current!.getBoundingClientRect().top < window.innerHeight - 48

    // In or above the viewport at mount: show immediately, never animate — we
    // must not flash-hide content the reader is already looking at.
    if (inView()) { setState('shown'); return }

    setState('hidden')

    let raf = 0
    const check = () => {
      raf = 0
      if (inView()) {
        setState('shown')
        if (once) detach()
      } else if (!once) {
        setState('hidden')
      }
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check) }
    const detach = () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return detach
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

  // 'ssr' renders with no inline style at all: visible, no transition armed.
  const style = state === 'shown' ? visibleStyle : state === 'hidden' ? hiddenStyle : undefined

  return (
    <div
      ref={ref}
      className={`duration-500 ease-[cubic-bezier(0.25,0.4,0.25,1)] ${className}`}
      style={style}
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
