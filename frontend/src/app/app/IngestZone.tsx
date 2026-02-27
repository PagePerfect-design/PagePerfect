'use client'

/* ═══════════════════════════════════════════════════════════════════
   INGEST ZONE — Typographic specimen-stage drop zone
   Replaces PortalStage idle phase. On the dark void, Swiss-stark.
   ═══════════════════════════════════════════════════════════════════ */

import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

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
      className="flex h-full w-full items-center justify-center"
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
      <AnimatePresence>
        {dragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-10"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,51,51,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,51,51,0.06) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-20 text-center">
        {/* Primary message — type as image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-mono text-[clamp(1.2rem,3vw,1.8rem)] uppercase tracking-[0.2em] text-[#111111]/80">
            Drop Manuscript
          </h1>
          <div className="mx-auto mt-3 h-px w-24 bg-[#111111]/15" />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[#111111]/35">
            .md · .txt · .docx
          </p>
        </motion.div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.txt,.markdown,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileSelect}
          className="sr-only"
        />

        {/* Paste mode */}
        <AnimatePresence>
          {pasteMode && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="mt-8 w-full max-w-md mx-auto"
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
                className="w-full h-40 resize-none border border-[#111111]/10 bg-white px-4 py-3 font-mono text-sm text-[#111111]/80 placeholder:text-[#111111]/25 focus:border-[#FF3333]/40 focus:outline-none"
                autoFocus
              />
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => { setPasteMode(false); setPasteText('') }}
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111]/40 transition-colors hover:text-[#111111]/70"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasteSubmit}
                  disabled={!pasteText.trim()}
                  className="inline-flex h-9 items-center gap-2 bg-[#FF3333] px-5 font-mono text-[10px] uppercase tracking-[0.1em] text-white transition-all hover:bg-[#E52222] disabled:opacity-30"
                >
                  Continue
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action row — Swiss monospace, no icons */}
        {!pasteMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111]/40 transition-colors duration-200 hover:text-[#111111]/80"
            >
              Browse Files
            </button>
            <span className="font-mono text-[10px] text-[#111111]/15">|</span>
            <button
              onClick={() => setPasteMode(true)}
              className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111]/40 transition-colors duration-200 hover:text-[#111111]/80"
            >
              Paste Text
            </button>
            <span className="font-mono text-[10px] text-[#111111]/15">|</span>
            {SAMPLES.map((s) => (
              <button
                key={s.key}
                onClick={() => onLoadSample(s.key)}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111]/40 transition-colors duration-200 hover:text-[#111111]/80"
              >
                {s.label}
              </button>
            ))}
          </motion.div>
        )}

        {/* Privacy line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/25"
        >
          Session-scoped · deleted on sign-out or within 24h
        </motion.p>
      </div>
    </div>
  )
}
