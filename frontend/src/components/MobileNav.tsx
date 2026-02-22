'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import CompositorMark from './CompositorMark'
import NavAuth from './NavAuth'

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center md:hidden"
        aria-label="Open menu"
      >
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none" className="text-[#111111]">
          <line y1="1" x2="18" y2="1" stroke="currentColor" strokeWidth="2" />
          <line y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="2" />
          <line y1="11" x2="18" y2="11" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>

      {/* Full-screen overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#FDFCF8] md:hidden">
          {/* Header */}
          <div className="flex h-12 items-center justify-between border-b border-[#111111] px-6">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 font-display text-[13px] font-bold uppercase tracking-[0.08em] text-[#111111]"
            >
              <CompositorMark size={26} />
              PagePerfect
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 items-center justify-center"
              aria-label="Close menu"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#111111]">
                <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="2" />
                <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-1 flex-col px-6 pt-8">
            {[
              { href: '/pricing', label: 'Pricing' },
              { href: '/journal', label: 'Journal' },
              { href: '/docs', label: 'Documentation' },
              { href: '/status', label: 'Status' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex h-12 items-center border-b border-[#111111]/10 font-mono text-[12px] uppercase tracking-[0.12em] transition-colors ${
                  pathname === href ? 'text-[#FF3333]' : 'text-[#111111] hover:text-[#FF3333]'
                }`}
              >
                {label}
              </Link>
            ))}

            {/* Auth */}
            <div className="mt-6 border-t border-[#111111]/10 pt-6">
              <NavAuth />
            </div>

            {/* CTA */}
            <div className="mt-auto pb-8">
              <Link
                href="/app"
                onClick={() => setOpen(false)}
                className="flex h-12 w-full items-center justify-center bg-[#FF3333] font-mono text-[11px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#E52222]"
              >
                Open Editor
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
