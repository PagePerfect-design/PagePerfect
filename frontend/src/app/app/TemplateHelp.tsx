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
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-ens-gray-200 text-ens-midnight bg-white hover:bg-ens-light focus:outline-none focus:ring-2 focus:ring-ens-blue"
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
          className="fixed z-[9999] w-[22rem] rounded-xl border border-ens-gray-200 bg-white p-4 shadow-xl"
          style={{
            top: position.top,
            left: position.left - 176, // Half of width (22rem = 352px)
          }}
        >
          <div className="font-semibold text-ens-midnight">Choose a template</div>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-ens-midnight">
            <li>
              <span className="font-semibold">Classic Academic (Chicago)</span> — serif (Libertinus), indented paragraphs, section headings in a classic style. Best for journal submissions, dissertations, and press guidelines that cite Chicago.
            </li>
            <li>
              <span className="font-semibold">Modern Trade Paperback</span> — sans (Lato), space between paragraphs, left-aligned headings. Best for trade non-fiction, proofs, and general-audience manuscripts.
            </li>
          </ul>
          <p className="mt-2 text-xs text-ens-gray-700">
            You can switch templates any time — the PDF recompiles automatically.
          </p>
        </div>,
        document.body
      )}
    </div>
  )
}
