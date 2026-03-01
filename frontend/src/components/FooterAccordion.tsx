'use client'

import { useState } from 'react'
import Link from 'next/link'

interface FooterLink {
  href: string
  label: string
}

export default function FooterAccordion({
  title,
  links,
}: {
  title: string
  links: FooterLink[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-[#111111]/10 md:border-0">
      {/* Mobile: tappable header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 md:hidden"
        aria-expanded={open}
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]">
          {title}
        </span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          className={`text-[#111111]/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
        </svg>
      </button>

      {/* Desktop: static heading */}
      <p className="mb-4 hidden font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111] md:block">
        {title}
      </p>

      {/* Links — always visible on desktop, toggle on mobile */}
      <div
        className={`overflow-hidden transition-[max-height] duration-350 ease-pp ease-out md:!max-h-none md:overflow-visible ${
          open ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="flex flex-col gap-0 pb-2 md:gap-2.5 md:pb-0">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex min-h-[44px] items-center font-body text-[12px] text-[#111111] transition-colors duration-200 ease-pp hover:text-[#FF3333] md:min-h-0"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
