'use client'
import { useEffect, useId, useRef, useState } from 'react'

export default function TemplateHelp() {
  const [open, setOpen] = useState(false)
  const tipId = useId()
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const tipRef = useRef<HTMLDivElement | null>(null)

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

      {open && (
        <div
          ref={tipRef}
          role="dialog"
          id={tipId}
          aria-label="Template guidance"
          className="absolute left-1/2 z-20 mt-2 w-[22rem] -translate-x-1/2 rounded-xl border border-ens-gray-200 bg-white p-4 shadow-card"
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
        </div>
      )}
    </div>
  )
}
