'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const CONSENT_KEY = 'pp-cookie-consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY)
    if (!consent) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-[#111111] bg-[#FDFCF8]">
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
            className="border border-[#111111]/20 bg-transparent px-5 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111] transition-all duration-75 hover:border-[#111111] hover:bg-[#111111] hover:text-white"
          >
            Manage Settings
          </Link>
          <button
            onClick={accept}
            className="border border-[#111111] bg-[#111111] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white transition-all duration-75 hover:bg-transparent hover:text-[#111111]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
