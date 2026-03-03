'use client'
import Link from 'next/link'
import CompositorMark from '@/components/CompositorMark'
import {
  ArrowLeft, Download, AlertTriangle, FileText,
  Loader2, BarChart3, FolderOpen, Cloud, CloudOff, RotateCcw,
} from 'lucide-react'

import type { Status, CompileError } from './editor-types'
import { translateError } from './editor-utils'
import Tooltip from './Tooltip'

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
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#111111]/10 px-4">
      {/* Screen reader: announce compile status changes */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {loading ? 'Compiling manuscript...' : status === 'error' && errors.length > 0 ? `Compile error: ${errors[0]?.message || 'Unknown error'}` : status === 'success' ? 'Compilation complete' : ''}
      </div>
      {/* Left: home + back + title */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Tooltip content="Home" placement="bottom">
          <Link
            href="/"
            className="flex h-8 w-8 shrink-0 items-center justify-center text-[#111111]/40 transition-colors hover:bg-[#111111]/[0.06] hover:text-[#111111]/70"
          >
            <CompositorMark size={18} />
          </Link>
        </Tooltip>
        <div className="hidden h-4 w-px bg-[#e5e5e0] sm:block" />
        <Tooltip content="Back to ingestion" detail="Return to manuscript upload" placement="bottom">
          <button
            onClick={onBack}
            className="hidden h-8 w-8 shrink-0 items-center justify-center text-[#111111]/40 transition-colors hover:bg-[#111111]/[0.06] hover:text-[#111111]/70 sm:flex"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
        <Tooltip content="Click to rename" placement="bottom" delay={800}>
          <input
            id="manuscript-title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="min-w-0 max-w-[280px] truncate bg-transparent font-display text-sm font-semibold text-[#111111]/80 placeholder:text-[#111111]/40 focus:text-[#111111] focus:outline-none"
            placeholder="Untitled"
          />
        </Tooltip>
        <span className="hidden shrink-0 font-mono text-[10px] text-[#111111]/40 sm:inline">
          {wordCount.toLocaleString()} words
        </span>

        {/* Cloud sync status */}
        {isLoggedIn && (
          <>
            <div className="hidden h-3 w-px bg-[#e5e5e0] sm:block" />
            {saving ? (
              <Tooltip content="Saving to cloud..." placement="bottom">
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#111111]/40">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                </span>
              </Tooltip>
            ) : saveError ? (
              <Tooltip content="Sync failed" detail={saveError} placement="bottom">
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-red-500/50">
                  <CloudOff className="h-2.5 w-2.5" />
                </span>
              </Tooltip>
            ) : (
              <Tooltip content="Saved to cloud" placement="bottom">
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-600/40">
                  <Cloud className="h-2.5 w-2.5" />
                </span>
              </Tooltip>
            )}
            <Tooltip content="Open saved manuscripts" shortcut="Esc to close" placement="bottom">
              <button
                onClick={onShowManuscripts}
                className="hidden h-7 w-7 items-center justify-center text-[#111111]/40 transition-colors hover:bg-[#111111]/[0.06] hover:text-[#111111]/70 sm:flex"
              >
                <FolderOpen className="h-3 w-3" />
              </button>
            </Tooltip>
          </>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        {errors.length > 0 && (() => {
          const e = errors[0]
          const msg = translateError(e.message)
          const isSoft = e.isSoft === true || (
            e.isSoft !== false &&
            /expired|recompile|refresh|try again/i.test(msg) && !/failed|error|missing/i.test(msg)
          )
          return (
            <Tooltip content={msg} placement="bottom">
              <span className={`hidden items-center gap-1.5 font-mono text-[10px] sm:inline-flex ${isSoft ? 'text-amber-500/70' : 'text-red-500/70'}`}>
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span className="max-w-[120px] truncate md:max-w-none">{msg.slice(0, 50)}</span>
              </span>
            </Tooltip>
          )
        })()}

        <Tooltip content="Recompile preview" detail="Auto-compiles after 3s of inactivity" shortcut="Space" placement="bottom">
          <button
            onClick={onCompile}
            disabled={loading}
            className="flex h-8 items-center gap-1.5 px-2 text-[11px] font-medium text-[#111111]/40 transition-all hover:bg-[#111111]/[0.04] hover:text-[#111111]/70 disabled:opacity-30 sm:px-3"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            <span className="hidden sm:inline">Compile</span>
          </button>
        </Tooltip>

        <Tooltip content={showEditor ? 'Show preview only' : 'Show text editor'} placement="bottom">
          <button
            onClick={onToggleEditor}
            className={`flex h-8 items-center gap-1.5 px-2 text-[11px] font-medium transition-all sm:px-3 ${
              showEditor
                ? 'bg-[#111111]/[0.08] text-[#111111]/70'
                : 'text-[#111111]/40 hover:bg-[#111111]/[0.04] hover:text-[#111111]/70'
            }`}
          >
            <FileText className="h-3 w-3" />
            <span className="hidden sm:inline">{showEditor ? 'Preview' : 'Edit'}</span>
          </button>
        </Tooltip>

        <Tooltip content="Analysis systems" detail="Typography, print quality, and manuscript analysis" placement="bottom">
          <button
            onClick={onToggleSystems}
            className={`hidden h-8 items-center gap-1.5 px-3 text-[11px] font-medium transition-all sm:flex ${
              showSystems
                ? 'bg-[#FF3333]/10 text-[#FF3333] ring-1 ring-[#FF3333]/30'
                : 'text-[#111111]/40 hover:bg-[#111111]/[0.04] hover:text-[#111111]/70'
            }`}
          >
            <BarChart3 className="h-3 w-3" />
            Systems
          </button>
        </Tooltip>

        <Tooltip
          content={status === 'success' ? 'Export your book' : 'Compile first to enable export'}
          detail={status === 'success' ? 'Opens pre-flight checks and download' : 'Waiting for successful compile'}
          placement="bottom"
        >
          <button
            onClick={onPublish}
            disabled={status !== 'success'}
            className="group inline-flex h-8 items-center gap-1.5 bg-[#FF3333] px-3 text-[11px] font-semibold text-white transition-all hover:bg-[#E52222] disabled:opacity-30 sm:gap-2 sm:px-5 sm:text-[12px]"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
