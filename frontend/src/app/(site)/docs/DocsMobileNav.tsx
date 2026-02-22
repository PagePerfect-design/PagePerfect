'use client'

import { useState } from 'react'
import { SECTIONS } from './DocsNav'

export default function DocsMobileNav() {
  const [open, setOpen] = useState(false)

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault()
    setOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      history.replaceState(null, '', `#${id}`)
    }
  }

  let lastGroup = ''

  return (
    <div className="lg:hidden mb-8">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between border border-[#1a1a1a] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[#1a1a1a] transition-colors hover:bg-[#f0f0ec]"
      >
        Sections
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <nav className="border border-t-0 border-[#1a1a1a] max-h-[60vh] overflow-y-auto bg-white">
          {SECTIONS.map((s) => {
            const showGroup = s.group && s.group !== lastGroup
            if (s.group) lastGroup = s.group
            const isTemplate = s.id.startsWith('template-')

            return (
              <div key={s.id}>
                {showGroup && (
                  <div className="px-4 pt-4 pb-1 font-mono text-[0.5625rem] uppercase tracking-[0.15em] text-[#555555]">
                    {s.group}
                  </div>
                )}
                <a
                  href={`#${s.id}`}
                  onClick={(e) => handleClick(e, s.id)}
                  className="block min-h-[44px] items-center border-b border-[#e5e5e0] px-4 py-2.5 font-display text-[0.8125rem] text-[#3a3a3a] transition-colors hover:bg-[#f5f5f0] hover:text-[#1a1a1a] active:bg-[#eae8e1]"
                  style={isTemplate ? { paddingLeft: '2rem', fontSize: '0.75rem', color: '#6a6a64' } : undefined}
                >
                  {s.label}
                </a>
              </div>
            )
          })}
        </nav>
      )}
    </div>
  )
}
