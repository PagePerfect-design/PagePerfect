'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const CONSENT_KEY = 'pp-cookie-consent'
// Enter/exit duration. Globals.css reduced-motion rule caps transition-duration
// to 0.01ms so motion-sensitive users see a snap (or fade-only when we strip translate below).
const ANIM_MS = 300
const EXIT_MS = 250

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  // `mounted` drives the enter animation: element is in DOM with translateY(100%)
  // on first render, then mounted flips to true on the next frame to trigger the transition.
  const [mounted, setMounted] = useState(false)
  // Designed reduced-motion fallback: fade only, no translate.
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY)
    if (!consent) setVisible(true)

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Trigger enter transition on the frame after mount so the browser sees
  // the initial (off-screen / faded) state and animates to the target state.
  useEffect(() => {
    if (!visible) return
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [visible])

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    // Exit animation: flip mounted -> false to retrigger translate/opacity transition,
    // then unmount after the transition completes.
    setMounted(false)
    window.setTimeout(() => setVisible(false), EXIT_MS)
  }

  if (!visible) return null

  // Resting (mounted) state: fully visible. Hidden state: faded (and translated unless reduced-motion).
  const hiddenTransform = reducedMotion ? 'translateY(0)' : 'translateY(100%)'
  const wrapperStyle: React.CSSProperties = {
    transform: mounted ? 'translateY(0)' : hiddenTransform,
    opacity: mounted ? 1 : 0,
    transition: `transform ${ANIM_MS}ms var(--ease-pp), opacity ${ANIM_MS}ms var(--ease-pp)`,
    willChange: 'transform, opacity',
  }

  return (
    <div
      data-cookie-consent
      className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-[#111111] bg-[#FDFCF8]"
      style={wrapperStyle}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111]">
            Site Telemetry &amp; Cookies
          </p>
          <p className="mt-1.5 max-w-2xl font-body text-[13px] leading-relaxed text-[#000000]">
            PagePerfect uses essential cookies to keep you logged in and functional telemetry
            to see if our engine is crashing. We do not run third-party advertising trackers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/cookies"
            className="border border-[#111111]/20 bg-transparent px-5 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111] transition-[background-color,color,border-color] duration-200 ease-pp hover:border-[#111111] hover:bg-[#111111] hover:text-white active:scale-[0.97]"
          >
            Manage Settings
          </Link>
          <button
            onClick={accept}
            className="border border-[#111111] bg-[#111111] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white transition-[background-color,color,border-color] duration-200 ease-pp hover:bg-transparent hover:text-[#111111] active:scale-[0.97]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
