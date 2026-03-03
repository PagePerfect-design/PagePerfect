'use client'

/* ═══════════════════════════════════════════════════════════════════
   INGEST ZONE — Swiss-Ogilvy manuscript ingestion gate
   Full-screen typographic authority. Drop zone with sharp geometry.
   ═══════════════════════════════════════════════════════════════════ */

import { useCallback, useRef, useState } from 'react'
import { ChevronRight, Upload } from 'lucide-react'

import { SAMPLES } from './sample'
import { cleanFromWord } from './editor-utils'

export default function IngestZone({
  onFileAccepted,
  onLoadSample,
  onPaste,
}: {
  onFileAccepted: (file: File) => void
  onLoadSample: (sampleKey: string) => void
  onPaste: (text: string) => void
}) {
  const [dragActive, setDragActive] = useState(false)
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      const file = e.dataTransfer.files[0]
      if (file) onFileAccepted(file)
    },
    [onFileAccepted],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFileAccepted(file)
    },
    [onFileAccepted],
  )

  const handlePasteSubmit = useCallback(() => {
    if (pasteText.trim()) {
      onPaste(cleanFromWord(pasteText))
      setPasteMode(false)
      setPasteText('')
    }
  }, [pasteText, onPaste])

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault()
        setDragActive(true)
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragActive(false)
      }}
      onDrop={handleDrop}
    >
      {/* Drag grid overlay */}
        {dragActive && (
          <div
            className="absolute inset-0 z-10 animate-fade-in"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,51,51,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,51,51,0.06) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        )}

      <div className="relative z-20 w-full max-w-xl px-8">

        {/* ── Red accent rule ── */}
        <div
          className="h-[2px] bg-[#FF3333] animate-fade-in"
          style={{ width: 64 }}
        />

        {/* ── Kicker ── */}
        <p
          className="mt-5 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/50 animate-fade-in"
        >
          01&ensp;Input
        </p>

        {/* ── Display heading — hero-scale typography ── */}
        <h1
          className="mt-3 font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[0.88] tracking-tighter text-[#111111] animate-fade-in-up"
        >
          Drop your
          <br />
          manuscript.
        </h1>

        {/* ── Body description ── */}
        <p
          className="mt-5 max-w-sm font-body text-sm leading-[1.7] text-[#333333] animate-fade-in"
        >
          Paste from Word, drag in a .docx, or start from a sample.
          Smart quotes and encoding artifacts are cleaned automatically.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.txt,.markdown,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileSelect}
          className="sr-only"
        />

        {/* ── Drop zone — bordered rectangle, sharp geometry ── */}
        {!pasteMode && (
          <div
            className="mt-8 animate-fade-in-up"
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={[
                'group flex w-full items-center justify-center gap-3 border-2 px-6 py-10 transition-all duration-200',
                dragActive
                  ? 'border-[#FF3333] bg-[#FF3333]/[0.03]'
                  : 'border-[#111111]/25 bg-white hover:border-[#111111]/50',
              ].join(' ')}
            >
              <Upload className={[
                'h-4 w-4 transition-colors duration-200',
                dragActive ? 'text-[#FF3333]' : 'text-[#111111]/40 group-hover:text-[#111111]/60',
              ].join(' ')} />
              <span className={[
                'font-mono text-[10px] uppercase tracking-[0.12em] transition-colors duration-200',
                dragActive ? 'text-[#FF3333]' : 'text-[#111111]/50 group-hover:text-[#111111]/70',
              ].join(' ')}>
                {dragActive ? 'Release to upload' : 'Drop file or browse'}
              </span>
            </button>

            <p className="mt-2.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#111111]/40">
              .md&ensp;&middot;&ensp;.txt&ensp;&middot;&ensp;.docx&ensp;&mdash;&ensp;up to 10 MB
            </p>
          </div>
        )}

        {/* ── Paste mode ── */}
          {pasteMode && (
            <div
              className="mt-8 animate-fade-in-up"
            >
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData?.getData('text/plain')
                  if (pasted) {
                    e.preventDefault()
                    setPasteText(pasted)
                  }
                }}
                placeholder="Paste or type your manuscript here..."
                className="w-full h-40 resize-none border-2 border-[#111111]/25 bg-white px-5 py-4 font-mono text-sm text-[#111111]/80 placeholder:text-[#111111]/40 focus:border-[#111111]/50 focus:outline-none"
                autoFocus
              />
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => { setPasteMode(false); setPasteText('') }}
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111]/50 transition-colors hover:text-[#111111]/70"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasteSubmit}
                  disabled={!pasteText.trim()}
                  className="inline-flex h-10 items-center gap-2 bg-[#FF3333] px-6 font-mono text-[10px] uppercase tracking-[0.1em] text-white transition-all hover:bg-[#E52222] disabled:opacity-30"
                >
                  Continue
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

        {/* ── Secondary actions ── */}
        {!pasteMode && (
          <div
            className="mt-6 animate-fade-in"
          >
            {/* Divider with "or" */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[#e5e5e0]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/40">or</span>
              <div className="h-px flex-1 bg-[#e5e5e0]" />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setPasteMode(true)}
                className="inline-flex h-9 items-center border border-[#111111]/20 px-5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111]/60 transition-all duration-200 hover:border-[#111111]/50 hover:text-[#111111]/90"
              >
                Paste Text
              </button>

              <span className="font-mono text-[9px] text-[#111111]/30">&middot;</span>

              {SAMPLES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => onLoadSample(s.key)}
                  className="inline-flex h-9 items-center border border-[#111111]/20 px-5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111]/60 transition-all duration-200 hover:border-[#111111]/50 hover:text-[#111111]/90"
                >
                  {s.label} Sample
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Privacy line ── */}
        <p
          className="mt-10 font-mono text-[9px] uppercase tracking-[0.12em] text-[#111111]/40 animate-fade-in"
        >
          Session-scoped&ensp;&middot;&ensp;deleted on sign-out or within 24h
        </p>

      </div>
    </div>
  )
}
