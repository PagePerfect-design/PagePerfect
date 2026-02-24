'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NavAuth from './NavAuth'

const NAV_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/journal', label: 'Journal' },
  { href: '/docs', label: 'Docs' },
] as const

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const close = useCallback(() => setOpen(false), [])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  // Close on route change
  useEffect(() => { close() }, [pathname, close])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, close])

  return (
    <div className="md:hidden">
      {/* Hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center"
        aria-label="Open menu"
        aria-expanded={open}
      >
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none" className="text-[#111111]">
          <line y1="1" x2="18" y2="1" stroke="currentColor" strokeWidth="2" />
          <line y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="2" />
          <line y1="11" x2="18" y2="11" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-[#111111]/20 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Slide-down panel */}
      <div
        className={`fixed inset-x-0 top-0 z-50 max-h-dvh overflow-y-auto bg-[#FDFCF8] shadow-lg transition-transform duration-250 ease-out ${
          open ? 'translate-y-0' : '-translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header — matches main nav bar */}
        <div className="flex h-12 items-center justify-between border-b border-[#111111] px-6">
          <Link
            href="/"
            onClick={close}
            className="font-display text-[13px] font-bold uppercase tracking-[0.08em] text-[#111111]"
          >
            PagePerfect
          </Link>
          <button
            onClick={close}
            className="flex h-10 w-10 items-center justify-center"
            aria-label="Close menu"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#111111]">
              <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="2" />
              <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>

        {/* Links */}
        <nav className="px-6 py-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              className={`flex h-12 items-center border-b border-[#111111]/10 font-mono text-[12px] uppercase tracking-[0.12em] transition-colors duration-75 ${
                pathname === href ? 'text-[#FF3333]' : 'text-[#111111]'
              }`}
            >
              {label}
            </Link>
          ))}

          {/* Auth row */}
          <div className="mt-4 border-t border-[#111111]/10 pt-4">
            <NavAuth />
          </div>
        </nav>

        {/* CTA pinned at bottom of panel */}
        <div className="border-t border-[#111111]/10 px-6 py-5">
          <Link
            href="/app"
            onClick={close}
            className="flex h-12 w-full items-center justify-center bg-[#FF3333] font-mono text-[11px] uppercase tracking-[0.1em] text-white transition-colors duration-75 hover:bg-[#E52222]"
          >
            Open Editor
          </Link>
        </div>
      </div>
    </div>
  )
}
