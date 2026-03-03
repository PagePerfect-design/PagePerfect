'use client'
import { useState } from 'react'
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

  if (!visible) return null

  return (
    <div
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
            <FolderOpen className="h-3.5 w-3.5 text-[#111111]/50" />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#111111]/50">
              My Manuscripts
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNew}
              className="flex h-7 items-center gap-1.5 px-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111]/50 transition-colors hover:bg-[#111111]/[0.04] hover:text-[#111111]/70"
            >
              <Plus className="h-3 w-3" />
              New
            </button>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center text-[#111111]/50 transition-colors hover:text-[#111111]/70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-[50vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-4 w-4 animate-spin text-[#111111]/50" />
            </div>
          ) : manuscripts.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-mono text-[11px] text-[#111111]/50">No saved manuscripts yet.</p>
              <p className="mt-1 font-mono text-[10px] text-[#111111]/40">Your work is auto-saved when you sign in.</p>
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
                    <span className={`text-[13px] font-medium ${isCurrent ? 'text-[#FF3333]' : 'text-[#111111]/70'}`}>
                      {m.title}
                    </span>
                    <span className="font-mono text-[10px] text-[#111111]/50">
                      {new Date(m.updated).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      {isCurrent && <span className="ml-2 text-[#FF3333]/60">Current</span>}
                    </span>
                  </button>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {isConfirmingDelete ? (
                      <>
                        <button
                          onClick={() => { onDelete(m.id); setConfirmDeleteId(null) }}
                          className="px-2 py-1 font-mono text-[10px] text-red-500 transition-colors hover:text-red-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 font-mono text-[10px] text-[#111111]/50 transition-colors hover:text-[#111111]/70"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(m.id)}
                        className="flex h-6 w-6 items-center justify-center text-[#111111]/40 transition-colors hover:text-red-500"
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
