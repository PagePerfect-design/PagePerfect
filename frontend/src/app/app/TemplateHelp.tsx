'use client'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function TemplateHelp() {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const tipId = useId()
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const tipRef = useRef<HTMLDivElement | null>(null)

  // Calculate position when opening
  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX + rect.width / 2
      })
    }
  }, [open])

  // close on escape / outside click
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onClick(e: MouseEvent) {
      if (!open) return
      if (tipRef.current && tipRef.current.contains(e.target as Node)) return
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return
      setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={tipId}
        onClick={() => setOpen(v => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-6 w-6 items-center justify-center border border-[#111111]/10 text-[#111111]/30 bg-[#111111]/[0.03] hover:bg-[#111111]/[0.06] hover:text-[#111111]/50 focus:outline-none focus:ring-2 focus:ring-[#FF3333]/30"
        title="About templates"
      >
        <span className="font-mono text-xs">?</span>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={tipRef}
          role="dialog"
          id={tipId}
          aria-label="Template guidance"
          className="fixed z-[9999] w-[22rem] border border-[#111111]/10 bg-white p-4 shadow-elevated"
          style={{
            top: position.top,
            left: position.left - 176, // Half of width (22rem = 352px)
          }}
        >
          <div className="font-display font-semibold text-[#111111] text-sm">Choose a design template</div>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-[#111111]/60">
            <li>
              <span className="font-semibold">🎼 Symphony Layout</span> — Classic academic design with harmonious typography. Perfect for scholarly papers, dissertations, and academic publications.
            </li>
            <li>
              <span className="font-semibold">📰 Chronicle Grid</span> — Editorial-style layout with multi-column grid system. Ideal for reports, white papers, and professional documents.
            </li>
            <li>
              <span className="font-semibold">🖼️ Exhibit Frame</span> — Modern trade design with clean lines and generous white space. Perfect for trade books and business documents.
            </li>
            <li>
              <span className="font-semibold">🏢 Corporate Matrix</span> — Structured business layout with systematic organization. Designed for corporate reports and presentations.
            </li>
            <li>
              <span className="font-semibold">🎨 Avant-Garde Canvas</span> — Experimental design with creative freedom. Perfect for creative projects and innovative publications.
            </li>
            <li>
              <span className="font-semibold">📚 Legacy Templates</span> — Classic Academic (Chicago) and Modern Trade Paperback for existing users.
            </li>
          </ul>
          <p className="mt-2 text-xs text-[#111111]/35">
            You can switch templates any time — the PDF recompiles automatically.
          </p>
        </div>,
        document.body
      )}
    </div>
  )
}
