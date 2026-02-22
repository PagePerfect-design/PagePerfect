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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 md:px-8">
        {/* Left: home + back + title */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#111111]/40 transition-colors hover:bg-[#111111]/[0.06] hover:text-[#111111]/70"
            title="Home"
          >
            <CompositorMark size={18} />
          </Link>
          <div className="h-4 w-px bg-[#111111]/10" />
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#111111]/30 transition-colors hover:bg-[#111111]/[0.06] hover:text-[#111111]/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="bg-transparent font-display text-sm font-semibold text-[#111111]/60 placeholder:text-[#111111]/25 focus:text-[#111111] focus:outline-none"
            placeholder="Untitled"
          />
          <span className="font-mono text-[10px] text-[#111111]/35">
            {wordCount.toLocaleString()} words
          </span>

          {/* Cloud sync status */}
          {isLoggedIn && (
            <>
              <div className="h-3 w-px bg-[#111111]/10" />
              {saving ? (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#111111]/30">
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
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#111111]/25 transition-colors hover:bg-[#111111]/[0.06] hover:text-[#111111]/50"
                title="My Manuscripts"
              >
                <FolderOpen className="h-3 w-3" />
              </button>
            </>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          {errors.length > 0 && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-red-500/70">
              <AlertTriangle className="h-3 w-3" />
              {translateError(errors[0].message).slice(0, 50)}
            </span>
          )}

          <button
            onClick={onCompile}
            disabled={loading}
            className="flex h-8 items-center gap-1.5 px-3 text-[11px] font-medium text-[#111111]/30 transition-all hover:bg-[#111111]/[0.04] hover:text-[#111111]/50 disabled:opacity-30"
            title="Recompile (Space)"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Keyboard className="h-3 w-3" />}
            Compile
          </button>

          <button
            onClick={onToggleEditor}
            className={`flex h-8 items-center gap-1.5 px-3 text-[11px] font-medium transition-all ${
              showEditor
                ? 'bg-[#111111]/[0.08] text-[#111111]/60'
                : 'text-[#111111]/30 hover:bg-[#111111]/[0.04] hover:text-[#111111]/50'
            }`}
          >
            <FileText className="h-3 w-3" />
            {showEditor ? 'Preview' : 'Edit'}
          </button>

          <button
            onClick={onToggleSystems}
            className={`flex h-8 items-center gap-1.5 px-3 text-[11px] font-medium transition-all ${
              showSystems
                ? 'bg-[#FF3333]/10 text-[#FF3333] ring-1 ring-[#FF3333]/30'
                : 'text-[#111111]/30 hover:bg-[#111111]/[0.04] hover:text-[#111111]/50'
            }`}
          >
            <BarChart3 className="h-3 w-3" />
            Systems
          </button>

          <button
            onClick={onPublish}
            disabled={status !== 'success'}
            className="group inline-flex h-8 items-center gap-2 bg-[#FF3333] px-5 text-[12px] font-semibold text-white transition-all hover:bg-[#E52222] disabled:opacity-30"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>
    </div>
  )
}
