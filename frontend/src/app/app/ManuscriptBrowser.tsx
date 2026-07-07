'use client'
import { useEffect, useRef, useState } from 'react'
import { FolderOpen, Plus, X, Loader2, Trash2 } from 'lucide-react'
import type { ManuscriptListItem } from '@/lib/use-manuscript'

export default function ManuscriptBrowser({
  visible,
  manuscripts,
  loading,
  currentId,
  onLoad,
  onDelete,
  onNew,
  onClose,
}: {
  visible: boolean
  manuscripts: ManuscriptListItem[]
  loading: boolean
  currentId: string | null
  onLoad: (id: string) => void
  onDelete: (id: string) => void
  onNew: () => void
  onClose: () => void
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!visible) return
    closeButtonRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [visible, onClose])

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Saved manuscripts"
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border border-[#111111]/10 bg-white shadow-elevated animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e5e0] px-5 py-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-3.5 w-3.5 text-[#555555]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#555555]">
              My Manuscripts
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNew}
              className="flex h-7 items-center gap-1.5 px-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#555555] transition-colors hover:bg-[#111111]/[0.04] hover:text-[#111111]"
            >
              <Plus className="h-3 w-3" />
              New
            </button>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close manuscripts"
              className="flex h-7 w-7 items-center justify-center text-[#555555] transition-colors hover:text-[#111111]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-[50vh] overflow-y-auto">
          {loading ? (
            <div role="status" aria-label="Loading manuscripts" className="flex items-center justify-center py-12">
              <Loader2 className="h-4 w-4 animate-spin text-[#555555]" />
            </div>
          ) : manuscripts.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-mono text-[11px] text-[#555555]">No saved manuscripts yet.</p>
              <p className="mt-1 font-mono text-[10px] text-[#555555]">Your work is auto-saved when you sign in.</p>
            </div>
          ) : (
            manuscripts.map((m) => {
              const isCurrent = m.id === currentId
              const isConfirmingDelete = confirmDeleteId === m.id
              return (
                <div
                  key={m.id}
                  className={`group flex items-center justify-between border-b border-[#e5e5e0] px-5 py-3 transition-colors ${
                    isCurrent ? 'bg-[#FF3333]/[0.04]' : 'hover:bg-[#111111]/[0.02]'
                  }`}
                >
                  <button
                    onClick={() => onLoad(m.id)}
                    className="flex flex-1 flex-col items-start gap-0.5 text-left"
                  >
                    <span className={`text-[13px] font-medium ${isCurrent ? 'text-[#E52222]' : 'text-[#333333]'}`}>
                      {m.title}
                    </span>
                    <span className="font-mono text-[10px] text-[#555555]">
                      {new Date(m.updated).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      {isCurrent && <span className="ml-2 text-[#E52222]">Current</span>}
                    </span>
                  </button>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100">
                    {isConfirmingDelete ? (
                      <>
                        <button
                          onClick={() => { onDelete(m.id); setConfirmDeleteId(null) }}
                          className="px-2 py-1 font-mono text-[10px] text-[#E52222] transition-colors hover:text-[#FF3333]"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 font-mono text-[10px] text-[#555555] transition-colors hover:text-[#111111]"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(m.id)}
                        aria-label={`Delete ${m.title}`}
                        className="flex h-6 w-6 items-center justify-center text-[#555555] transition-colors hover:text-[#E52222]"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
