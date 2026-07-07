'use client'

import { useEffect, useRef, useState, useCallback, useId, cloneElement } from 'react'
import { createPortal } from 'react-dom'

/* ═══════════════════════════════════════════════════════════════════
   TOOLTIP — Swiss-precision contextual help
   Portal-based, auto-positioned, keyboard accessible.
   Sharp edges, monospace text, cream background.
   ═══════════════════════════════════════════════════════════════════ */

type Placement = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  /** The content shown inside the tooltip */
  content: React.ReactNode
  /** Optional secondary line of text */
  detail?: string
  /** Optional keyboard shortcut hint */
  shortcut?: string
  /** Preferred placement (auto-adjusts if clipped) */
  placement?: Placement
  /** Delay in ms before showing (default 400) */
  delay?: number
  /** The trigger element */
  children: React.ReactElement<Record<string, unknown>>
  /** Disable the tooltip */
  disabled?: boolean
}

interface Position {
  top: number
  left: number
  placement: Placement
}

function calculatePosition(
  triggerRect: DOMRect,
  tipRect: { width: number; height: number },
  preferred: Placement,
): Position {
  const gap = 6
  const margin = 8

  const placements: Record<Placement, Position> = {
    top: {
      top: triggerRect.top - tipRect.height - gap,
      left: triggerRect.left + triggerRect.width / 2 - tipRect.width / 2,
      placement: 'top',
    },
    bottom: {
      top: triggerRect.bottom + gap,
      left: triggerRect.left + triggerRect.width / 2 - tipRect.width / 2,
      placement: 'bottom',
    },
    left: {
      top: triggerRect.top + triggerRect.height / 2 - tipRect.height / 2,
      left: triggerRect.left - tipRect.width - gap,
      placement: 'left',
    },
    right: {
      top: triggerRect.top + triggerRect.height / 2 - tipRect.height / 2,
      left: triggerRect.right + gap,
      placement: 'right',
    },
  }

  // Try preferred placement first, then fallbacks
  const order: Placement[] = [preferred, 'top', 'bottom', 'right', 'left']
  for (const p of order) {
    const pos = placements[p]
    if (
      pos.top >= margin &&
      pos.left >= margin &&
      pos.top + tipRect.height <= window.innerHeight - margin &&
      pos.left + tipRect.width <= window.innerWidth - margin
    ) {
      return pos
    }
  }

  // Clamp to viewport as last resort
  const pos = placements[preferred]
  return {
    top: Math.max(margin, Math.min(pos.top, window.innerHeight - tipRect.height - margin)),
    left: Math.max(margin, Math.min(pos.left, window.innerWidth - tipRect.width - margin)),
    placement: preferred,
  }
}

export default function Tooltip({
  content,
  detail,
  shortcut,
  placement = 'top',
  delay = 400,
  children,
  disabled,
}: TooltipProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<Position | null>(null)
  const triggerRef = useRef<HTMLElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<number | null>(null)

  const show = useCallback(() => {
    if (disabled) return
    timerRef.current = window.setTimeout(() => {
      setVisible(true)
    }, delay)
  }, [delay, disabled])

  const hide = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setVisible(false)
  }, [])

  // Position the tooltip when it becomes visible
  useEffect(() => {
    if (!visible || !triggerRef.current) return

    const updatePosition = () => {
      if (!triggerRef.current || !tipRef.current) return
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tipRect = tipRef.current.getBoundingClientRect()
      setPosition(calculatePosition(triggerRect, tipRect, placement))
    }

    // Initial position (use requestAnimationFrame to ensure tipRef is rendered)
    requestAnimationFrame(updatePosition)

    // Reposition on scroll/resize
    window.addEventListener('scroll', hide, { passive: true })
    window.addEventListener('resize', hide, { passive: true })
    return () => {
      window.removeEventListener('scroll', hide)
      window.removeEventListener('resize', hide)
    }
  }, [visible, placement, hide])

  // Escape dismisses the tooltip while visible
  useEffect(() => {
    if (!visible) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [visible, hide])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  // Clone the child to attach trigger handlers + ref
  // Use display:contents so the wrapper is invisible to CSS grid/flex layout
  const trigger = (
    <span
      ref={triggerRef as React.RefObject<HTMLSpanElement>}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      style={{ display: 'contents' }}
    >
      {cloneElement(children, { 'aria-describedby': visible ? id : undefined })}
    </span>
  )

  const tooltip = visible && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={tipRef}
          id={id}
          role="tooltip"
          className="fixed z-[99999] pointer-events-none"
          style={{
            top: position?.top ?? -9999,
            left: position?.left ?? -9999,
            opacity: position ? 1 : 0,
            transition: 'opacity 0.1s ease-out',
          }}
        >
          <div className="border border-[#111111]/15 bg-white px-2 py-2 shadow-md max-w-[240px]">
            <p className="font-mono text-[10px] leading-snug text-[#111111] whitespace-nowrap">
              {content}
            </p>
            {detail && (
              <p className="mt-0.5 font-mono text-[10px] leading-snug text-[#555555]">
                {detail}
              </p>
            )}
            {shortcut && (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111]/50">
                <kbd className="inline-flex items-center border border-[#111111]/10 bg-[#f5f5f0] px-1 py-0.5 font-mono text-[10px]">
                  {shortcut}
                </kbd>
              </p>
            )}
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <>
      {trigger}
      {tooltip}
    </>
  )
}
