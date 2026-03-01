'use client'

/* ═══════════════════════════════════════════════════════════════════
   CONTROL STRIP — Swiss typographic control panel
   Narrow left column with numbered sections. Type replaces icons.
   Each section shows live state when collapsed.
   ═══════════════════════════════════════════════════════════════════ */

import { useState, useRef, useCallback } from 'react'
import { Lock, Upload, Loader2, X, Check, AlertTriangle, Download, Package } from 'lucide-react'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('./RichTextEditor'), { ssr: false })

import ImageUpload from './ImageUpload'
import Tooltip from './Tooltip'
import type {
  TemplateKey, HeadingVariant, PageSize, MarginPreset,
  CompileMode, CustomFont, Asset, Status, Genre, CompileQuality,
  Platform, PaperStock, ExportFormat, PreflightCheck, PreflightResult,
} from './editor-types'
import {
  TEMPLATE_INFO, TEMPLATE_KEYS, HEADING_VARIANT_INFO,
  PAGE_SIZES, MARGIN_INFO, GENRE_LABELS, GENRE_ORDER,
  hasTier,
} from './editor-types'

/* ─── Section wrapper ─────────────────────────────────────────── */

function Section({
  number,
  label,
  summary,
  helpText,
  open,
  onToggle,
  children,
  accentColor,
}: {
  number: string
  label: string
  summary: string
  helpText?: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
  accentColor?: string
}) {
  return (
    <div className="border-b border-[#e5e5e0]">
      <button
        onClick={onToggle}
        className="flex w-full items-baseline gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-[#f5f5f0]"
      >
        <span className="font-mono text-[10px] font-bold text-[#111111]/40">{number}</span>
        <div className="flex-1 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#111111]/60">
            {label}
          </span>
          {!open && (
            <span className={`ml-2 font-mono text-[10px] tracking-[0.05em] ${accentColor || 'text-[#111111]/40'}`}>
              {summary}
            </span>
          )}
        </div>
      </button>
      <div
        className="overflow-hidden transition-all duration-200"
        style={{
          maxHeight: open ? '2000px' : '0px',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="px-4 pb-4">
          {/* Help text — contextual guidance when section is open */}
          {helpText && (
            <p className="mb-3 font-mono text-[9px] leading-relaxed text-[#111111]/40">
              {helpText}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

/* ─── Main ControlStrip ───────────────────────────────────────── */

export default function ControlStrip({
  // Manuscript
  manuscript,
  onManuscriptChange,
  onFileUpload,
  assets,
  onAssetsChange,
  // Template
  template,
  headingVariant,
  onTemplateChange,
  onHeadingVariantChange,
  // Layout
  pageSize,
  marginPreset,
  onPageSizeChange,
  onMarginChange,
  userTier,
  // Settings
  compileMode,
  safeMode,
  customFont,
  fontUploading,
  onCompileModeChange,
  onSafeModeChange,
  onFontUpload,
  onFontRemove,
  // Export
  status,
  quality,
  pdfUrl,
  lastDownloadWatermarked,
  publisherWindowEnd,
  wordCount,
  manuscriptText,
  title,
  customFontForExport,
  safeModeForExport,
  compileModeForExport,
  headingVariantForExport,
  onDownload,
  targetPlatform,
}: {
  manuscript: string
  onManuscriptChange: (m: string) => void
  onFileUpload: (f: File) => void
  assets: Asset[]
  onAssetsChange: (a: Asset[]) => void
  template: TemplateKey
  headingVariant: HeadingVariant
  onTemplateChange: (t: TemplateKey) => void
  onHeadingVariantChange: (v: HeadingVariant) => void
  pageSize: PageSize
  marginPreset: MarginPreset
  onPageSizeChange: (s: PageSize) => void
  onMarginChange: (m: MarginPreset) => void
  userTier: string
  compileMode: CompileMode
  safeMode: boolean
  customFont: CustomFont
  fontUploading: boolean
  onCompileModeChange: (m: CompileMode) => void
  onSafeModeChange: (s: boolean) => void
  onFontUpload: (f: File) => void
  onFontRemove: () => void
  status: Status
  quality: CompileQuality
  pdfUrl: string | null
  lastDownloadWatermarked: boolean
  publisherWindowEnd: string | null
  wordCount: number
  manuscriptText: string
  title: string
  customFontForExport: CustomFont
  safeModeForExport: boolean
  compileModeForExport: CompileMode
  headingVariantForExport: HeadingVariant
  onDownload: (platform: Platform) => void
  targetPlatform?: Platform | null
}) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['template']))
  const [genreFilter, setGenreFilter] = useState<Genre>('all')
  const [editorMode, setEditorMode] = useState<'markdown' | 'richtext'>('richtext')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggle = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleInsertMarkdown = useCallback((text: string) => {
    const ta = textareaRef.current
    if (ta) {
      const start = ta.selectionStart
      const before = manuscript.slice(0, start)
      const after = manuscript.slice(ta.selectionEnd)
      onManuscriptChange(`${before}${text}\n${after}`)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + text.length + 1
        ta.focus()
      })
    } else {
      onManuscriptChange(manuscript + '\n' + text + '\n')
    }
  }, [manuscript, onManuscriptChange])

  const filteredTemplates = genreFilter === 'all'
    ? TEMPLATE_KEYS
    : TEMPLATE_KEYS.filter(k => TEMPLATE_INFO[k].genre === genreFilter)

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col overflow-y-auto border-r border-[#e5e5e0] bg-[#FDFCF8]">
      {/* ── 01 MANUSCRIPT ─────────────────────────────────── */}
      <Section
        number="01"
        label="Manuscript"
        summary={`${wordCount.toLocaleString()} words`}
        helpText="Edit your text here or upload a .md / .docx file. Changes auto-compile after 3 seconds."
        open={openSections.has('manuscript')}
        onToggle={() => toggle('manuscript')}
      >
        <div className="space-y-3">
          {/* Editor mode toggle */}
          <div className="flex gap-1 border border-[#e5e5e0] p-0.5">
            {(['richtext', 'markdown'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setEditorMode(mode)}
                className={`flex-1 py-1 font-mono text-[9px] uppercase tracking-[0.1em] transition-all duration-150 ${
                  editorMode === mode
                    ? 'bg-[#f5f5f0] text-[#111111]/70'
                    : 'text-[#111111]/50 hover:text-[#111111]/70'
                }`}
              >
                {mode === 'richtext' ? 'Rich Text' : 'Markdown'}
              </button>
            ))}
          </div>

          {editorMode === 'markdown' ? (
            <>
              <textarea
                ref={textareaRef}
                value={manuscript}
                onChange={(e) => onManuscriptChange(e.target.value)}
                className="h-48 w-full resize-y border border-[#e5e5e0] bg-white p-3 font-mono text-[11px] leading-[1.8] text-[#111111]/70 caret-[#FF3333] focus:border-[#FF3333]/30 focus:outline-none"
                placeholder="# Chapter One&#10;&#10;Write here..."
              />
              <ImageUpload
                assets={assets}
                onAssetsChange={onAssetsChange}
                onInsertMarkdown={handleInsertMarkdown}
              />
            </>
          ) : (
            <div className="h-64 overflow-hidden border border-[#e5e5e0]">
              <RichTextEditor
                markdown={manuscript}
                onChange={onManuscriptChange}
                onClose={() => setEditorMode('markdown')}
              />
            </div>
          )}

          {/* Upload / replace document */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.md,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onFileUpload(file)
              e.target.value = ''
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-1.5 border border-[#e5e5e0] py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#111111]/50 transition-all duration-150 hover:border-[#111111]/20 hover:text-[#111111]/70"
          >
            <Upload className="h-3 w-3" />
            Upload Document
          </button>
        </div>
      </Section>

      {/* ── 02 TEMPLATE ───────────────────────────────────── */}
      <Section
        number="02"
        label="Template"
        summary={`${TEMPLATE_INFO[template].name} · ${TEMPLATE_INFO[template].font}`}
        helpText="Pick a design for your book. Each template sets fonts, spacing, and chapter styles. Use ← → arrow keys to cycle quickly."
        open={openSections.has('template')}
        onToggle={() => toggle('template')}
      >
        {/* Genre tabs */}
        <div className="mb-3 flex gap-1">
          {(['all', ...GENRE_ORDER] as Genre[]).map((g) => {
            const genreDescriptions: Record<Genre, string> = {
              all: 'Show all 15 templates',
              fiction: 'Novels, short stories, memoirs',
              nonfiction: 'Academic, business, journalism',
              specialist: 'Poetry, screenplays, cookbooks, tech docs',
            }
            return (
              <Tooltip key={g} content={genreDescriptions[g]} placement="bottom">
                <button
                  onClick={() => setGenreFilter(g)}
                  className={`px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] transition-all duration-150 ${
                    genreFilter === g
                      ? 'bg-[#f5f5f0] text-[#111111]/70'
                      : 'text-[#111111]/40 hover:text-[#111111]/70'
                  }`}
                >
                  {GENRE_LABELS[g]}
                </button>
              </Tooltip>
            )
          })}
        </div>

        {/* Template grid — 2 columns, uniform fixed-height cards */}
        <div className="grid grid-cols-2 gap-1.5">
          {filteredTemplates.map((key) => {
            const info = TEMPLATE_INFO[key]
            const isActive = key === template
            const isSerif = info.kind === 'serif'
            const isMono = info.kind === 'mono'
            return (
              <Tooltip key={key} content={info.subtitle} detail={info.vibe} placement="right">
                <button
                  onClick={() => onTemplateChange(key)}
                  className={`flex h-[72px] flex-col justify-between border p-2 text-left transition-all duration-150 ${
                    isActive
                      ? 'border-[#FF3333] bg-[#FF3333]/[0.03]'
                      : 'border-[#e5e5e0] hover:border-[#111111]/30 hover:bg-[#111111]/[0.01]'
                  }`}
                >
                  {/* Top: type specimen preview — shows the character of the template */}
                  <p className={`truncate text-[13px] leading-none ${isActive ? 'text-[#111111]' : 'text-[#111111]/50'} ${
                    isMono ? 'font-mono font-normal' : isSerif ? 'font-body font-semibold italic' : 'font-display font-bold tracking-tight'
                  }`}>
                    {info.specimen}
                  </p>
                  {/* Bottom: name + kind badge — always same position */}
                  <div className="flex items-end justify-between gap-1">
                    <span className={`truncate font-mono text-[9px] leading-none ${isActive ? 'text-[#111111]/70' : 'text-[#111111]/40'}`}>
                      {info.name}
                    </span>
                    <span className={`shrink-0 font-mono text-[7px] uppercase leading-none tracking-[0.08em] ${
                      isActive ? 'text-[#FF3333]/60' : 'text-[#111111]/25'
                    }`}>
                      {info.kind}
                    </span>
                  </div>
                </button>
              </Tooltip>
            )
          })}
        </div>

        {/* Heading variant */}
        <div className="mt-3 flex items-center justify-between border-t border-[#e5e5e0] pt-3">
          <Tooltip content="Chapter heading style" detail="Changes how chapter titles and section headings appear" placement="right">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#111111]/50">Headings</span>
          </Tooltip>
          <div className="flex gap-1">
            {(['classic', 'modern', 'bold'] as HeadingVariant[]).map((v) => (
              <Tooltip key={v} content={HEADING_VARIANT_INFO[v].label} detail={HEADING_VARIANT_INFO[v].desc} placement="bottom">
                <button
                  onClick={() => onHeadingVariantChange(v)}
                  className={`px-2.5 py-1 font-mono text-[9px] transition-all duration-150 ${
                    headingVariant === v
                      ? 'bg-[#111111] text-white'
                      : 'text-[#111111]/40 hover:bg-[#f5f5f0] hover:text-[#111111]/70'
                  }`}
                >
                  {HEADING_VARIANT_INFO[v].label}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 03 LAYOUT ─────────────────────────────────────── */}
      <Section
        number="03"
        label="Layout"
        summary={`${PAGE_SIZES[pageSize]?.label || pageSize} · ${MARGIN_INFO[marginPreset]?.label || marginPreset}`}
        helpText="Set your book's physical dimensions and margins. Choose a standard size for your publishing platform."
        open={openSections.has('layout')}
        onToggle={() => toggle('layout')}
      >
        {/* Page sizes — default 6 */}
        <Tooltip content="Physical trim size of your book" detail="Pick a standard size for your publishing platform" placement="right">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#111111]/50">Page Size</p>
        </Tooltip>
        <div className="grid grid-cols-3 gap-1.5">
          {(['fiveFiveByEightFive', 'sixByNine', 'a5', 'royal', 'letter', 'a4'] as PageSize[]).map((key) => {
            const info = PAGE_SIZES[key]
            const isActive = key === pageSize
            return (
              <Tooltip key={key} content={info.label} detail={info.desc} placement="right">
                <button
                  onClick={() => onPageSizeChange(key)}
                  className={`border py-2 text-center transition-all duration-150 ${
                    isActive
                      ? 'border-[#FF3333] bg-[#FF3333]/[0.03]'
                      : 'border-[#e5e5e0] hover:border-[#111111]/20'
                  }`}
                >
                  <span className={`block text-[10px] font-medium ${isActive ? 'text-[#111111]' : 'text-[#111111]/50'}`}>
                    {info.label}
                  </span>
                  <span className="block font-mono text-[8px] text-[#111111]/40">{info.desc}</span>
                </button>
              </Tooltip>
            )
          })}
        </div>

        {/* More book sizes */}
        <details className="mt-3">
          <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.1em] text-[#111111]/50 hover:text-[#111111]/70">
            More book sizes {userTier === 'drafter' && <Lock className="ml-1 inline h-2.5 w-2.5 opacity-40" />}
          </summary>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {(['massMarket', 'aFormat', 'bFormat', 'fiveTwentyFiveByEight', 'demy', 'sevenByTen', 'b5', 'crownQuarto'] as PageSize[]).map((key) => {
              const info = PAGE_SIZES[key]
              const isActive = key === pageSize
              const locked = userTier === 'drafter'
              return (
                <button
                  key={key}
                  onClick={() => onPageSizeChange(key)}
                  className={`relative border py-2 text-center transition-all duration-150 ${
                    isActive
                      ? 'border-[#FF3333] bg-[#FF3333]/[0.03]'
                      : 'border-[#e5e5e0] hover:border-[#111111]/20'
                  } ${locked ? 'opacity-60' : ''}`}
                >
                  <span className={`block text-[10px] font-medium ${isActive ? 'text-[#111111]' : 'text-[#111111]/50'}`}>
                    {info.label}
                  </span>
                  {locked && <Lock className="absolute right-1 top-1 h-2 w-2 text-[#111111]/60" />}
                </button>
              )
            })}
          </div>
          {userTier === 'drafter' && (
            <p className="mt-1.5 font-mono text-[8px] text-[#111111]/50">
              Preview only — <a href="/pricing" className="underline hover:text-[#111111]/70">upgrade</a>
            </p>
          )}
        </details>

        {/* Amazon KDP sizes */}
        <details className="mt-2">
          <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.1em] text-[#111111]/50 hover:text-[#111111]/70">
            Amazon KDP {userTier === 'drafter' && <Lock className="ml-1 inline h-2.5 w-2.5 opacity-40" />}
          </summary>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {(['amazonFiveByEight', 'amazonSixByNine', 'amazonSevenByTen', 'amazonEightByTen', 'amazonEightFiveByEleven'] as PageSize[]).map((key) => {
              const info = PAGE_SIZES[key]
              const isActive = key === pageSize
              const locked = userTier === 'drafter'
              return (
                <button
                  key={key}
                  onClick={() => onPageSizeChange(key)}
                  className={`relative border py-2 text-center transition-all duration-150 ${
                    isActive
                      ? 'border-[#FF3333] bg-[#FF3333]/[0.03]'
                      : 'border-[#e5e5e0] hover:border-[#111111]/20'
                  } ${locked ? 'opacity-60' : ''}`}
                >
                  <span className={`block text-[10px] font-medium ${isActive ? 'text-[#111111]' : 'text-[#111111]/50'}`}>
                    {info.label}
                  </span>
                  {locked && <Lock className="absolute right-1 top-1 h-2 w-2 text-[#111111]/60" />}
                </button>
              )
            })}
          </div>
        </details>

        {/* Margins */}
        <Tooltip content="Inner whitespace around text" detail="Wider margins = more readable, fewer words per page" placement="right">
          <p className="mb-2 mt-4 font-mono text-[9px] uppercase tracking-[0.12em] text-[#111111]/50">Margins</p>
        </Tooltip>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(MARGIN_INFO) as MarginPreset[]).map((key) => {
            const info = MARGIN_INFO[key]
            const isActive = key === marginPreset
            return (
              <Tooltip key={key} content={info.label} detail={info.desc} placement="bottom">
                <button
                  onClick={() => onMarginChange(key)}
                  className={`border px-2.5 py-1.5 transition-all duration-150 ${
                    isActive
                      ? 'border-[#FF3333] bg-[#FF3333]/[0.03]'
                      : 'border-[#e5e5e0] hover:border-[#111111]/20'
                  }`}
                >
                  <span className={`block font-mono text-[9px] ${isActive ? 'text-[#111111]' : 'text-[#111111]/50'}`}>
                    {info.label}
                  </span>
                </button>
              </Tooltip>
            )
          })}
        </div>
      </Section>

      {/* ── 04 SETTINGS ───────────────────────────────────── */}
      <Section
        number="04"
        label="Settings"
        summary={`${compileMode === 'fast' ? 'Fast' : 'Full'} · ${safeMode ? 'Standard' : 'Citations'}`}
        helpText="Control how your book compiles. Fast mode is quicker; Full runs additional typography passes."
        open={openSections.has('settings')}
        onToggle={() => toggle('settings')}
      >
        {/* Compile mode */}
        <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#111111]/50">Compile Mode</p>
        <div className="flex border border-[#e5e5e0] p-0.5">
          {(['fast', 'full'] as CompileMode[]).map((mode) => {
            const modeDescriptions = {
              fast: 'Quick preview — single LuaLaTeX pass',
              full: 'Publication quality — multiple passes for TOC, references',
            }
            return (
              <Tooltip key={mode} content={mode === 'fast' ? 'Fast compile' : 'Full compile'} detail={modeDescriptions[mode]} placement="bottom">
                <button
                  onClick={() => onCompileModeChange(mode)}
                  className={`flex-1 py-1.5 text-center font-mono text-[10px] transition-all duration-150 ${
                    compileMode === mode
                      ? 'bg-[#f5f5f0] text-[#111111]/70'
                      : 'text-[#111111]/40 hover:text-[#111111]/70'
                  }`}
                >
                  {mode === 'fast' ? 'Fast' : 'Full'}
                </button>
              </Tooltip>
            )
          })}
        </div>

        {/* Safe mode */}
        <Tooltip content="Standard mode" detail={safeMode ? 'Citations and bibliography are skipped. Uncheck to enable @cite references.' : 'Citations active — your @cite references will be processed with BibTeX.'} placement="right">
          <label className="mt-3 flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={safeMode}
              onChange={(e) => onSafeModeChange(e.target.checked)}
              className="mt-0.5 h-3 w-3 accent-[#FF3333]"
            />
            <div>
              <span className="font-mono text-[10px] text-[#111111]/60">Standard mode</span>
              <p className="font-mono text-[9px] leading-snug text-[#111111]/40">
                {safeMode ? 'Citations skipped — uncheck for bibliography' : 'Citations active — using bibliography references'}
              </p>
            </div>
          </label>
        </Tooltip>

        {/* Custom font */}
        <div className="mt-4 border-t border-[#e5e5e0] pt-3">
          <Tooltip content="Upload your own font" detail="Use a .ttf or .otf file as the main body font. Studio tier required." placement="right">
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#111111]/50">Custom Font</p>
          </Tooltip>
          {!hasTier(userTier, 'studio') ? (
            <Tooltip content="Studio feature" detail="Upload custom fonts with a Studio lifetime license ($199)" placement="right">
              <a href="/pricing" className="flex items-center justify-center gap-2 border border-dashed border-[#e5e5e0] py-2 font-mono text-[10px] text-[#111111]/40 transition-all hover:border-[#111111]/20 hover:text-[#111111]/70">
                <Lock className="h-3 w-3" />Studio — <span className="underline">Upgrade</span>
              </a>
            </Tooltip>
          ) : customFont ? (
            <div className="flex items-center gap-2 bg-[#f5f5f0] px-3 py-2">
              <span className="flex-1 truncate font-mono text-[10px] text-[#111111]/50">{customFont.originalName}</span>
              <button onClick={onFontRemove} className="text-[#111111]/50 hover:text-red-500/60">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className={`flex cursor-pointer items-center justify-center gap-2 border border-dashed border-[#e5e5e0] py-2 font-mono text-[10px] transition-all ${
              fontUploading ? 'text-[#111111]/50' : 'text-[#111111]/50 hover:border-[#111111]/20 hover:text-[#111111]/70'
            }`}>
              {fontUploading ? (
                <><Loader2 className="h-3 w-3 animate-spin" />Uploading...</>
              ) : (
                <><Upload className="h-3 w-3" />Upload .ttf / .otf</>
              )}
              <input
                type="file"
                accept=".ttf,.otf"
                className="hidden"
                disabled={fontUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onFontUpload(f)
                  e.target.value = ''
                }}
              />
            </label>
          )}
        </div>
      </Section>

      {/* ── 05 EXPORT ─────────────────────────────────────── */}
      <ExportSection
        number="05"
        open={openSections.has('export')}
        onToggle={() => toggle('export')}
        status={status}
        quality={quality}
        pdfUrl={pdfUrl}
        userTier={userTier}
        publisherWindowEnd={publisherWindowEnd}
        lastDownloadWatermarked={lastDownloadWatermarked}
        pageSize={pageSize}
        marginPreset={marginPreset}
        template={template}
        wordCount={wordCount}
        onDownload={onDownload}
        targetPlatform={targetPlatform}
        manuscript={manuscriptText}
        title={title}
        customFont={customFontForExport}
        safeMode={safeModeForExport}
        compileMode={compileModeForExport}
        headingVariant={headingVariantForExport}
      />

      {/* Spacer to push above status bar */}
      <div className="h-8" />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   EXPORT SECTION — Inline pre-flight, quality gates, download
   ═══════════════════════════════════════════════════════════════════ */

function ExportSection({
  number,
  open,
  onToggle,
  status,
  quality,
  pdfUrl,
  userTier,
  publisherWindowEnd,
  lastDownloadWatermarked,
  pageSize,
  marginPreset,
  template,
  wordCount,
  onDownload,
  targetPlatform,
  manuscript,
  title,
  customFont,
  safeMode,
  compileMode,
  headingVariant,
}: {
  number: string
  open: boolean
  onToggle: () => void
  status: Status
  quality: CompileQuality
  pdfUrl: string | null
  userTier: string
  publisherWindowEnd: string | null
  lastDownloadWatermarked: boolean
  pageSize: PageSize
  marginPreset: MarginPreset
  template: TemplateKey
  wordCount: number
  onDownload: (platform: Platform) => void
  targetPlatform?: Platform | null
  manuscript: string
  title: string
  customFont: CustomFont
  safeMode: boolean
  compileMode: CompileMode
  headingVariant: HeadingVariant
}) {
  const [platform, setPlatform] = useState<Platform>(targetPlatform || 'kdp')
  const [paper, setPaper] = useState<PaperStock>('white')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf')
  const [preflight, setPreflight] = useState<PreflightResult | null>(null)
  const [checking, setChecking] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [contractAccepted, setContractAccepted] = useState(false)
  const [qualityAcknowledged, setQualityAcknowledged] = useState(false)
  const [epubLoading, setEpubLoading] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)

  // Run preflight when export section opens or settings change
  const lastPreflightRef = useRef('')
  const runPreflight = useCallback(async () => {
    const key = `${pageSize}:${marginPreset}:${template}:${wordCount}:${platform}:${paper}`
    if (key === lastPreflightRef.current) return
    lastPreflightRef.current = key

    setChecking(true)
    setFetchError(null)
    setPreflight(null)
    setContractAccepted(false)
    setQualityAcknowledged(false)

    try {
      const res = await fetch('/api/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageSize, marginPreset, template, wordCount, platform, paperStock: paper }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setFetchError(data?.message || `Pre-flight failed (${res.status})`)
        setChecking(false)
        return
      }
      const data: PreflightResult = await res.json()
      setPreflight(data)
      setChecking(false)
    } catch {
      setFetchError('Could not reach pre-flight engine.')
      setChecking(false)
    }
  }, [pageSize, marginPreset, template, wordCount, platform, paper])

  // Auto-run preflight when section is opened
  const wasOpenRef = useRef(false)
  if (open && !wasOpenRef.current) {
    wasOpenRef.current = true
    runPreflight()
  }
  if (!open) wasOpenRef.current = false

  const hasFailure = preflight?.checks.some(c => c.status === 'fail')
  const isGradeD = quality?.typographyGrade === 'D'
  const canDownload = !checking && !hasFailure && !fetchError && pdfUrl && (!isGradeD || qualityAcknowledged)

  const statusIcon = (s: PreflightCheck['status']) =>
    s === 'pass'  ? <Check className="h-2.5 w-2.5 shrink-0 text-emerald-500" /> :
    s === 'fail'  ? <X className="h-2.5 w-2.5 shrink-0 text-red-500" /> :
    s === 'warn'  ? <AlertTriangle className="h-2.5 w-2.5 shrink-0 text-amber-500" /> :
                    <span className="inline-block h-2.5 w-2.5 shrink-0 text-center font-mono text-[8px] text-[#111111]/50">·</span>

  const summaryText = status === 'success'
    ? (checking ? 'Checking...' : hasFailure ? 'Blocked' : fetchError ? 'Error' : 'Ready')
    : 'Compile first'

  // EPUB/Batch handlers (same as LaunchOverlay)
  async function handleEpubDownload() {
    setEpubLoading(true)
    try {
      const { createClient, isPocketBaseConfigured } = await import('@/lib/supabase')
      const body: Record<string, unknown> = {
        manuscriptText: manuscript, template, headingVariant,
        title: title || 'Manuscript', pageSize, marginPreset,
        safeMode, compileMode, outputFormat: 'epub', download: true,
      }
      if (customFont) body.customFonts = { main: customFont.fontId }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (isPocketBaseConfigured) {
        const pb = createClient()
        if (pb.authStore.isValid && pb.authStore.token) headers['Authorization'] = `Bearer ${pb.authStore.token}`
      }
      const resp = await fetch('/api/compile', { method: 'POST', headers, body: JSON.stringify(body) })
      if (!resp.ok) { const d = await resp.json().catch(() => null); alert(d?.message || 'EPUB export failed.'); return }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      const { slug } = await import('./editor-utils')
      a.download = `${slug(title) || 'manuscript'}.epub`
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    } catch { alert('EPUB export failed.') } finally { setEpubLoading(false) }
  }

  async function handleBatchExport() {
    setBatchLoading(true)
    try {
      const { createClient, isPocketBaseConfigured } = await import('@/lib/supabase')
      const allSizes = Object.keys(PAGE_SIZES)
      const body: Record<string, unknown> = {
        manuscriptText: manuscript, template, title: title || 'Manuscript',
        marginPreset, safeMode, compileMode, pageSizes: allSizes, download: true,
      }
      if (customFont) body.customFonts = { main: customFont.fontId }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (isPocketBaseConfigured) {
        const pb = createClient()
        if (pb.authStore.isValid && pb.authStore.token) headers['Authorization'] = `Bearer ${pb.authStore.token}`
      }
      const resp = await fetch('/api/batch-compile', { method: 'POST', headers, body: JSON.stringify(body) })
      if (!resp.ok) { const d = await resp.json().catch(() => null); alert(d?.message || 'Batch export failed.'); return }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      const { slug } = await import('./editor-utils')
      a.download = `${slug(title) || 'manuscript'}-batch.zip`
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    } catch { alert('Batch export failed.') } finally { setBatchLoading(false) }
  }

  return (
    <div className="border-b border-[#e5e5e0]">
      <button
        onClick={onToggle}
        className="flex w-full items-baseline gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-[#f5f5f0]"
      >
        <span className="font-mono text-[10px] font-bold text-[#111111]/40">{number}</span>
        <div className="flex-1 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#111111]/60">Export</span>
          {!open && (
            <span className="ml-2 font-mono text-[10px] tracking-[0.05em] text-[#111111]/40">{summaryText}</span>
          )}
        </div>
      </button>

      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? '3000px' : '0px', opacity: open ? 1 : 0 }}
      >
        <div className="space-y-3 px-4 pb-4">
          <p className="font-mono text-[9px] leading-relaxed text-[#111111]/40">
            Choose your publishing platform, then run pre-flight checks before downloading.
          </p>
          {/* Platform */}
          <div>
            <Tooltip content="Select your target platform" detail="Each platform has specific requirements for trim, bleed, and color" placement="right">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#111111]/50">Platform</p>
            </Tooltip>
            <div className="flex gap-1.5">
              <Tooltip content="Amazon KDP" detail="Spine, gutter, and trim validated for KDP specs" placement="bottom">
                <button
                  onClick={() => { setPlatform('kdp'); lastPreflightRef.current = ''; runPreflight() }}
                  className={`flex-1 border py-2 font-mono text-[10px] transition-all duration-150 ${
                    platform === 'kdp' ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#e5e5e0] text-[#111111]/50 hover:border-[#111111]/20'
                  }`}
                >
                  Amazon KDP
                </button>
              </Tooltip>
              <Tooltip content="IngramSpark" detail={hasTier(userTier, 'publisher') ? 'PDF/X-1a, CMYK, bleed compliance' : 'Publisher tier required — upgrade for IngramSpark support'} placement="bottom">
                <button
                  onClick={() => { if (hasTier(userTier, 'publisher')) { setPlatform('ingram'); lastPreflightRef.current = ''; runPreflight() } }}
                  className={`flex-1 border py-2 font-mono text-[10px] transition-all duration-150 ${
                    platform === 'ingram' ? 'border-[#FF3333] bg-[#FF3333] text-white' : 'border-[#e5e5e0] text-[#111111]/50 hover:border-[#111111]/20'
                  } ${!hasTier(userTier, 'publisher') ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  IngramSpark {!hasTier(userTier, 'publisher') && <Lock className="ml-1 inline h-2 w-2" />}
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Paper stock */}
          <div className="flex gap-1.5">
            {(['white', 'cream'] as PaperStock[]).map((p) => (
              <button
                key={p}
                onClick={() => { setPaper(p); lastPreflightRef.current = ''; runPreflight() }}
                className={`flex-1 border py-1.5 font-mono text-[10px] capitalize transition-all duration-150 ${
                  paper === p
                    ? (p === 'cream' ? 'border-[#c5b370] bg-[#f5f0d0] text-[#111111]' : 'border-[#111111] bg-[#111111] text-white')
                    : 'border-[#e5e5e0] text-[#111111]/60 hover:border-[#111111]/20'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Pre-flight results */}
          <div className="border border-[#e5e5e0]">
            <div className="flex items-center gap-2 border-b border-[#e5e5e0] bg-[#f5f5f0] px-3 py-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${
                checking ? 'bg-amber-500 animate-pulse'
                : fetchError || hasFailure ? 'bg-red-500'
                : 'bg-emerald-500'
              }`} />
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#111111]/50">
                Pre-flight
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto p-3 font-mono text-[10px] leading-[1.8]">
              {checking ? (
                <div className="flex items-center gap-2 text-[#111111]/50">
                  <div className="h-2.5 w-2.5 animate-spin rounded-full border border-[#111111]/20 border-t-transparent" />
                  Checking...
                </div>
              ) : fetchError ? (
                <span className="text-red-500/70">{fetchError}</span>
              ) : preflight ? (
                preflight.checks.map((check, i) => (
                  <div key={i} className="mb-1 flex items-start gap-2">
                    <span className="mt-0.5">{statusIcon(check.status)}</span>
                    <span className={
                      check.status === 'pass' ? 'text-[#111111]/60' :
                      check.status === 'fail' ? 'text-red-600/80' :
                      check.status === 'warn' ? 'text-amber-600/70' :
                      'text-[#111111]/50'
                    }>
                      {check.name}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-[#111111]/50">Compile first, then export</span>
              )}
            </div>

            {/* Stats */}
            {!checking && preflight && (
              <div className="grid grid-cols-3 gap-px border-t border-[#e5e5e0] bg-[#f5f5f0]">
                <div className="bg-[#FDFCF8] p-2 text-center">
                  <p className="font-mono text-[7px] uppercase tracking-wider text-[#111111]/50">Pages</p>
                  <p className="font-mono text-[11px] font-bold text-[#111111]">~{preflight.stats.estimatedPages}</p>
                </div>
                <div className="bg-[#FDFCF8] p-2 text-center">
                  <p className="font-mono text-[7px] uppercase tracking-wider text-[#111111]/50">Spine</p>
                  <p className="font-mono text-[11px] font-bold text-[#111111]">{preflight.stats.spineInches}&quot;</p>
                </div>
                <div className="bg-[#FDFCF8] p-2 text-center">
                  <p className="font-mono text-[7px] uppercase tracking-wider text-[#111111]/50">Trim</p>
                  <p className="font-mono text-[11px] font-bold text-[#111111]">{preflight.stats.trimWidth}&times;{preflight.stats.trimHeight}</p>
                </div>
              </div>
            )}
          </div>

          {/* Quality warning */}
          {quality?.typographyGrade && (quality.typographyGrade === 'C' || quality.typographyGrade === 'D') && (
            <div className={`border px-3 py-2 ${
              quality.typographyGrade === 'D'
                ? 'border-red-500/20 bg-red-500/[0.04]'
                : 'border-amber-500/20 bg-amber-500/[0.04]'
            }`}>
              <p className={`font-mono text-[10px] font-semibold ${
                quality.typographyGrade === 'D' ? 'text-red-800/80' : 'text-amber-800/80'
              }`}>
                {quality.typographyGrade === 'D' ? 'Low quality' : 'Review typography'}
              </p>
              {quality.typographyGrade === 'D' && (
                <label className="mt-2 flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={qualityAcknowledged}
                    onChange={(e) => setQualityAcknowledged(e.target.checked)}
                    className="mt-0.5 h-3 w-3 accent-red-600"
                  />
                  <span className="font-mono text-[9px] leading-relaxed text-red-700/50">
                    I understand quality is below threshold.
                  </span>
                </label>
              )}
            </div>
          )}

          {/* Format toggle */}
          <div className="flex border border-[#e5e5e0] p-0.5">
            {(['pdf', 'epub'] as ExportFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setExportFormat(fmt)}
                className={`flex-1 py-1.5 text-center font-mono text-[10px] uppercase transition-all duration-150 ${
                  exportFormat === fmt
                    ? 'bg-[#f5f5f0] text-[#111111]/70'
                    : 'text-[#111111]/50 hover:text-[#111111]/70'
                }`}
              >
                {fmt}{fmt === 'epub' && !hasTier(userTier, 'studio') && <Lock className="ml-1 inline h-2 w-2 opacity-40" />}
              </button>
            ))}
          </div>

          {/* Free tier warning */}
          {!hasTier(userTier, 'publisher') && exportFormat === 'pdf' && (
            <div className="border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2">
              <p className="font-mono text-[10px] font-semibold text-amber-800/80">Free Preview — Watermarked</p>
              <a href="/pricing" className="mt-1 inline-block font-mono text-[9px] text-amber-700/60 underline hover:text-amber-800">
                Remove watermark — $19.99
              </a>
            </div>
          )}

          {/* Download button — THE red CTA */}
          {exportFormat === 'pdf' ? (
            <button
              onClick={() => onDownload(platform)}
              disabled={!canDownload}
              className="flex h-10 w-full items-center justify-center gap-2 bg-[#FF3333] font-mono text-[10px] uppercase tracking-[0.1em] text-white transition-all duration-200 hover:bg-[#E52222] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Download className="h-3.5 w-3.5" />
              {hasTier(userTier, 'publisher') ? 'Download PDF' : 'Download Preview (Watermarked)'}
            </button>
          ) : !hasTier(userTier, 'studio') ? (
            <a
              href="/pricing"
              className="flex h-10 w-full items-center justify-center gap-2 border border-[#e5e5e0] font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111]/50"
            >
              <Lock className="h-3 w-3" />EPUB — Studio Only
            </a>
          ) : (
            <button
              onClick={handleEpubDownload}
              disabled={epubLoading}
              className="flex h-10 w-full items-center justify-center gap-2 bg-[#FF3333] font-mono text-[10px] uppercase tracking-[0.1em] text-white transition-all hover:bg-[#E52222] disabled:opacity-50"
            >
              {epubLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generating...</> : <><Download className="h-3.5 w-3.5" />Download EPUB</>}
            </button>
          )}

          {/* Batch export */}
          {hasTier(userTier, 'studio') ? (
            <button
              onClick={handleBatchExport}
              disabled={batchLoading || !pdfUrl}
              className="flex h-8 w-full items-center justify-center gap-2 border border-[#e5e5e0] font-mono text-[9px] uppercase tracking-[0.1em] text-[#111111]/50 transition-all hover:border-[#111111]/20 hover:text-[#111111]/70 disabled:opacity-30"
            >
              {batchLoading ? <><Loader2 className="h-3 w-3 animate-spin" />Exporting...</> : <><Package className="h-3 w-3" />Batch — All Sizes</>}
            </button>
          ) : (
            <a href="/pricing" className="flex h-8 w-full items-center justify-center gap-2 border border-[#e5e5e0] font-mono text-[9px] uppercase tracking-[0.1em] text-[#111111]/60">
              <Lock className="h-2.5 w-2.5" />Batch — Studio
            </a>
          )}

          {/* Failure block */}
          {!checking && hasFailure && (
            <div className="border border-red-500/20 bg-red-500/[0.04] px-3 py-2 text-center">
              <p className="font-mono text-[9px] text-red-600">Export blocked — fix pre-flight issues</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
