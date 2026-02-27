'use client'
import Link from 'next/link'
import CompositorMark from '@/components/CompositorMark'
import {
  ArrowLeft, Download, AlertTriangle, FileText, Keyboard,
  Loader2, BarChart3, FolderOpen, Cloud, CloudOff,
} from 'lucide-react'

import type { Status, CompileError } from './editor-types'
import { translateError } from './editor-utils'

export default function TopBar({
  title,
  wordCount,
  status,
  loading,
  errors,
  showEditor,
  showSystems,
  saving,
  saveError,
  isLoggedIn,
  onTitleChange,
  onBack,
  onPublish,
  onCompile,
  onToggleEditor,
  onToggleSystems,
  onShowManuscripts,
}: {
  title: string
  wordCount: number
  status: Status
  loading: boolean
  errors: CompileError[]
  showEditor: boolean
  showSystems: boolean
  saving: boolean
  saveError: string | null
  isLoggedIn: boolean
  onTitleChange: (t: string) => void
  onBack: () => void
  onPublish: () => void
  onCompile: () => void
  onToggleEditor: () => void
  onToggleSystems: () => void
  onShowManuscripts: () => void
}) {
  return (
    <div className="fixed left-0 right-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-6 sm:py-3 md:px-8">
        {/* Left: home + back + title */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="flex h-8 w-8 shrink-0 items-center justify-center text-[#111111]/50 transition-colors hover:bg-[#111111]/[0.06] hover:text-[#111111]/80"
            title="Home"
          >
            <CompositorMark size={18} />
          </Link>
          <div className="hidden h-4 w-px bg-[#111111]/15 sm:block" />
          <button
            onClick={onBack}
            className="hidden h-8 w-8 shrink-0 items-center justify-center text-[#111111]/50 transition-colors hover:bg-[#111111]/[0.06] hover:text-[#111111]/70 sm:flex"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <input
            id="manuscript-title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="min-w-0 max-w-[120px] truncate bg-transparent font-display text-sm font-semibold text-[#111111]/70 placeholder:text-[#111111]/40 focus:text-[#111111] focus:outline-none sm:max-w-none"
            placeholder="Untitled"
          />
          <span className="hidden font-mono text-[10px] text-[#111111]/50 sm:inline">
            {wordCount.toLocaleString()} words
          </span>

          {/* Cloud sync status */}
          {isLoggedIn && (
            <>
              <div className="hidden h-3 w-px bg-[#111111]/15 sm:block" />
              {saving ? (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#111111]/50">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                </span>
              ) : saveError ? (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-red-500/50" title={saveError}>
                  <CloudOff className="h-2.5 w-2.5" />
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-600/40" title="Synced">
                  <Cloud className="h-2.5 w-2.5" />
                </span>
              )}
              <button
                onClick={onShowManuscripts}
                className="hidden h-7 w-7 items-center justify-center text-[#111111]/50 transition-colors hover:bg-[#111111]/[0.06] hover:text-[#111111]/70 sm:flex"
                title="My Manuscripts"
              >
                <FolderOpen className="h-3 w-3" />
              </button>
            </>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          {errors.length > 0 && (() => {
            const e = errors[0]
            const msg = translateError(e.message)
            // Prefer structured isSoft flag; fall back to regex detection
            const isSoft = e.isSoft === true || (
              e.isSoft !== false &&
              /expired|recompile|refresh|try again/i.test(msg) && !/failed|error|missing/i.test(msg)
            )
            return (
              <span className={`hidden items-center gap-1.5 font-mono text-[10px] sm:inline-flex ${isSoft ? 'text-amber-500/70' : 'text-red-500/70'}`}>
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span className="max-w-[120px] truncate md:max-w-none">{msg.slice(0, 50)}</span>
              </span>
            )
          })()}

          <button
            onClick={onCompile}
            disabled={loading}
            className="flex h-8 items-center gap-1.5 px-2 text-[11px] font-medium text-[#111111]/50 transition-all hover:bg-[#111111]/[0.04] hover:text-[#111111]/70 disabled:opacity-30 sm:px-3"
            title="Recompile (Space)"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Keyboard className="h-3 w-3" />}
            <span className="hidden sm:inline">Compile</span>
          </button>

          <button
            onClick={onToggleEditor}
            className={`flex h-8 items-center gap-1.5 px-2 text-[11px] font-medium transition-all sm:px-3 ${
              showEditor
                ? 'bg-[#111111]/[0.08] text-[#111111]/70'
                : 'text-[#111111]/50 hover:bg-[#111111]/[0.04] hover:text-[#111111]/70'
            }`}
          >
            <FileText className="h-3 w-3" />
            <span className="hidden sm:inline">{showEditor ? 'Preview' : 'Edit'}</span>
          </button>

          <button
            onClick={onToggleSystems}
            className={`hidden h-8 items-center gap-1.5 px-3 text-[11px] font-medium transition-all sm:flex ${
              showSystems
                ? 'bg-[#FF3333]/10 text-[#FF3333] ring-1 ring-[#FF3333]/30'
                : 'text-[#111111]/50 hover:bg-[#111111]/[0.04] hover:text-[#111111]/70'
            }`}
          >
            <BarChart3 className="h-3 w-3" />
            Systems
          </button>

          <button
            onClick={onPublish}
            disabled={status !== 'success'}
            className="group inline-flex h-8 items-center gap-1.5 bg-[#FF3333] px-3 text-[11px] font-semibold text-white transition-all hover:bg-[#E52222] disabled:opacity-30 sm:gap-2 sm:px-5 sm:text-[12px]"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>
    </div>
  )
}
