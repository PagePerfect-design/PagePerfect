'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Paintbrush,
  Ruler,
  Settings2,
  Lock,
  Upload,
  Loader2,
  X,
} from 'lucide-react'

import type {
  TemplateKey, HeadingVariant, PageSize, MarginPreset,
  CompileMode, HudTab, CustomFont, Status, Genre, CompileQuality,
} from './editor-types'
import {
  TEMPLATE_INFO, TEMPLATE_KEYS, HEADING_VARIANT_INFO,
  PAGE_SIZES, MARGIN_INFO, GENRE_LABELS, GENRE_ORDER,
  ease, hasTier,
} from './editor-types'

/* ═══════════════════════════════════════════════════════════════════
   DOCK BUTTON — Individual button in the floating dock
   ═══════════════════════════════════════════════════════════════════ */

function DockButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-medium transition-all duration-150 sm:gap-2 sm:px-4 sm:text-[12px] ${
        active
          ? 'bg-[#111111] text-white shadow-lg'
          : 'text-[#111111]/60 hover:bg-[#111111]/[0.05] hover:text-[#111111]/70'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   FLOATING HUD — Dock + Fan menus
   ═══════════════════════════════════════════════════════════════════ */

export default function FloatingHUD({
  template,
  headingVariant,
  pageSize,
  marginPreset,
  compileMode,
  safeMode,
  status,
  activeTab,
  customFont,
  fontUploading,
  userTier,
  onTabChange,
  onTemplateChange,
  onHeadingVariantChange,
  onPageSizeChange,
  onMarginChange,
  onCompileModeChange,
  onSafeModeChange,
  onFontUpload,
  onFontRemove,
  quality,
}: {
  template: TemplateKey
  headingVariant: HeadingVariant
  pageSize: PageSize
  marginPreset: MarginPreset
  compileMode: CompileMode
  safeMode: boolean
  status: Status
  activeTab: HudTab
  customFont: CustomFont
  fontUploading: boolean
  userTier: string
  onTabChange: (t: HudTab) => void
  onTemplateChange: (t: TemplateKey) => void
  onHeadingVariantChange: (v: HeadingVariant) => void
  onPageSizeChange: (s: PageSize) => void
  onMarginChange: (m: MarginPreset) => void
  onCompileModeChange: (m: CompileMode) => void
  onSafeModeChange: (s: boolean) => void
  onFontUpload: (file: File) => void
  onFontRemove: () => void
  quality?: CompileQuality
}) {
  const [genreFilter, setGenreFilter] = useState<Genre>('all')
  const [hoveredTemplate, setHoveredTemplate] = useState<TemplateKey | null>(null)

  const toggleTab = (tab: HudTab) => {
    onTabChange(activeTab === tab ? null : tab)
  }

  const filteredTemplates = genreFilter === 'all'
    ? TEMPLATE_KEYS
    : TEMPLATE_KEYS.filter(k => TEMPLATE_INFO[k].genre === genreFilter)

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-fit -translate-x-1/2 sm:bottom-8 sm:w-auto">
      {/* Fan menus — pop up above the dock */}
      <AnimatePresence>
        {activeTab === 'style' && (
          <motion.div
            key="style-fan"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease }}
            className="mb-3 w-[calc(100vw-2rem)] border border-[#111111]/15 bg-white shadow-elevated backdrop-blur-xl sm:w-[520px]"
          >
            {/* Genre tabs */}
            <div className="flex gap-0.5 overflow-x-auto border-b border-[#e5e5e0] px-3 pt-2">
              {(['all', ...GENRE_ORDER] as Genre[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGenreFilter(g)}
                  className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-all ${
                    genreFilter === g
                      ? 'bg-[#111111]/[0.06] text-[#111111]/70'
                      : 'text-[#111111]/50 hover:text-[#111111]/70'
                  }`}
                >
                  {GENRE_LABELS[g]}
                </button>
              ))}
            </div>

            {/* Template cards */}
            <div className="max-h-[50vh] overflow-y-auto p-2">
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {filteredTemplates.map((key) => {
                  const info = TEMPLATE_INFO[key]
                  const isActive = key === template
                  const isHovered = key === hoveredTemplate
                  return (
                    <button
                      key={key}
                      onClick={() => { onTemplateChange(key); onTabChange(null) }}
                      onMouseEnter={() => setHoveredTemplate(key)}
                      onMouseLeave={() => setHoveredTemplate(null)}
                      className={`group relative flex flex-col items-start px-3 py-3 text-left transition-all duration-150 ${
                        isActive
                          ? 'bg-[#FF3333]/10 ring-1 ring-[#FF3333]/30'
                          : 'hover:bg-[#111111]/[0.04]'
                      }`}
                    >
                      <span className={`text-[12px] font-semibold ${isActive ? 'text-[#111111]' : 'text-[#111111]/60'}`}>
                        {info.name}
                      </span>
                      <span className={`text-[10px] ${isActive ? 'text-[#FF3333]/80' : 'text-[#111111]/50'}`}>
                        {info.subtitle}
                      </span>

                      <AnimatePresence>
                        {isHovered && !isActive && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute -top-12 left-0 z-50 w-48 border border-[#111111]/15 bg-white px-3 py-2 shadow-elevated"
                          >
                            <p className="font-body text-[10px] leading-[1.5] text-[#111111]/50">
                              {info.vibe}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Heading variant toggle */}
            <div className="flex items-center justify-between border-t border-[#e5e5e0] px-4 py-2.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111]/50">Headings</span>
              <div className="flex gap-1">
                {(['classic', 'modern', 'bold'] as HeadingVariant[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => onHeadingVariantChange(v)}
                    className={`px-3 py-1 font-mono text-[10px] transition-all ${
                      headingVariant === v
                        ? 'bg-[#111111] text-white'
                        : 'text-[#111111]/55 hover:bg-[#111111]/[0.05] hover:text-[#111111]/80'
                    }`}
                  >
                    {HEADING_VARIANT_INFO[v].label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'layout' && (
          <motion.div
            key="layout-fan"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease }}
            className="mb-3 w-[calc(100vw-2rem)] border border-[#111111]/15 bg-white p-3 shadow-elevated backdrop-blur-xl sm:w-auto sm:p-4"
          >
            {/* Page Size */}
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/50">Page Size</p>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {(['fiveFiveByEightFive', 'sixByNine', 'a5', 'royal', 'letter', 'a4'] as PageSize[]).map((key) => {
                const info = PAGE_SIZES[key]
                const isActive = key === pageSize
                return (
                  <button
                    key={key}
                    onClick={() => onPageSizeChange(key)}
                    className={`px-3 py-2 text-center transition-all duration-150 ${
                      isActive
                        ? 'bg-[#FF3333]/10 ring-1 ring-[#FF3333]/30'
                        : 'bg-[#111111]/[0.02] hover:bg-[#111111]/[0.05]'
                    }`}
                  >
                    <span className={`block text-[11px] font-medium ${isActive ? 'text-[#111111]' : 'text-[#111111]/50'}`}>
                      {info.label}
                    </span>
                    <span className="block font-mono text-[8px] text-[#111111]/50">{info.desc}</span>
                  </button>
                )
              })}
            </div>

            {/* More book sizes */}
            <details className="mt-3">
              <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.1em] text-[#111111]/55 hover:text-[#111111]/75">
                More book sizes {userTier === 'drafter' && <Lock className="ml-1 inline h-2.5 w-2.5 opacity-40" />}
              </summary>
              <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                {(['massMarket', 'aFormat', 'bFormat', 'fiveTwentyFiveByEight', 'demy', 'sevenByTen', 'b5', 'crownQuarto'] as PageSize[]).map((key) => {
                  const info = PAGE_SIZES[key]
                  const isActive = key === pageSize
                  const locked = userTier === 'drafter'
                  return (
                    <button
                      key={key}
                      onClick={() => onPageSizeChange(key)}
                      className={`relative px-3 py-2 text-center transition-all duration-150 ${
                        isActive
                          ? 'bg-[#FF3333]/10 ring-1 ring-[#FF3333]/30'
                          : 'bg-[#111111]/[0.02] hover:bg-[#111111]/[0.05]'
                      } ${locked ? 'opacity-60' : ''}`}
                    >
                      <span className={`block text-[11px] font-medium ${isActive ? 'text-[#111111]' : 'text-[#111111]/50'}`}>
                        {info.label}
                      </span>
                      <span className="block font-mono text-[8px] text-[#111111]/50">{info.desc}</span>
                      {locked && <Lock className="absolute right-1 top-1 h-2 w-2 text-[#111111]/40" />}
                    </button>
                  )
                })}
              </div>
              {userTier === 'drafter' && (
                <p className="mt-1.5 text-center font-mono text-[8px] text-[#111111]/50">
                  Preview only — <a href="/pricing" className="underline hover:text-[#111111]/70">upgrade</a> to download these sizes
                </p>
              )}
            </details>

            {/* Amazon KDP */}
            <details className="mt-3">
              <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.1em] text-[#111111]/55 hover:text-[#111111]/75">
                Amazon KDP sizes {userTier === 'drafter' && <Lock className="ml-1 inline h-2.5 w-2.5 opacity-40" />}
              </summary>
              <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                {(['amazonFiveByEight', 'amazonSixByNine', 'amazonSevenByTen', 'amazonEightByTen', 'amazonEightFiveByEleven'] as PageSize[]).map((key) => {
                  const info = PAGE_SIZES[key]
                  const isActive = key === pageSize
                  const locked = userTier === 'drafter'
                  return (
                    <button
                      key={key}
                      onClick={() => onPageSizeChange(key)}
                      className={`relative px-3 py-2 text-center transition-all ${
                        isActive
                          ? 'bg-[#FF3333]/10 ring-1 ring-[#FF3333]/30'
                          : 'bg-[#111111]/[0.02] hover:bg-[#111111]/[0.05]'
                      } ${locked ? 'opacity-60' : ''}`}
                    >
                      <span className={`block text-[11px] font-medium ${isActive ? 'text-[#111111]' : 'text-[#111111]/50'}`}>
                        {info.label}
                      </span>
                      <span className="block font-mono text-[8px] text-[#111111]/50">{info.desc}</span>
                      {locked && <Lock className="absolute right-1 top-1 h-2 w-2 text-[#111111]/40" />}
                    </button>
                  )
                })}
              </div>
              {userTier === 'drafter' && (
                <p className="mt-1.5 text-center font-mono text-[8px] text-[#111111]/50">
                  Preview only — <a href="/pricing" className="underline hover:text-[#111111]/70">upgrade</a> to download these sizes
                </p>
              )}
            </details>

            {/* Margins */}
            <p className="mb-2 mt-4 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/50">Margins</p>
            <div className="flex gap-1.5 overflow-x-auto">
              {(Object.keys(MARGIN_INFO) as MarginPreset[]).map((key) => {
                const info = MARGIN_INFO[key]
                const isActive = key === marginPreset
                return (
                  <button
                    key={key}
                    onClick={() => onMarginChange(key)}
                    className={`shrink-0 px-3 py-1.5 text-center transition-all duration-150 ${
                      isActive
                        ? 'bg-[#FF3333]/10 ring-1 ring-[#FF3333]/30'
                        : 'bg-[#111111]/[0.02] hover:bg-[#111111]/[0.05]'
                    }`}
                    title={info.desc}
                  >
                    <span className={`block text-[11px] font-medium ${isActive ? 'text-[#111111]' : 'text-[#111111]/50'}`}>
                      {info.label}
                    </span>
                    <span className="block font-mono text-[8px] text-[#111111]/50">{info.desc}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings-fan"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease }}
            className="mb-3 w-[calc(100vw-2rem)] border border-[#111111]/15 bg-white p-4 shadow-elevated backdrop-blur-xl sm:w-72"
          >
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/50">Compile Options</p>

            <div className="mb-3 flex bg-[#111111]/[0.03] p-0.5">
              {(['fast', 'full'] as CompileMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onCompileModeChange(mode)}
                  className={`flex-1 px-3 py-1.5 text-center text-[11px] font-medium transition-all duration-150 ${
                    compileMode === mode
                      ? 'bg-[#111111]/[0.08] text-[#111111]'
                      : 'text-[#111111]/60 hover:text-[#111111]/80'
                  }`}
                >
                  {mode === 'fast' ? 'Fast' : 'Full'}
                </button>
              ))}
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 px-1 py-1.5 transition-colors hover:bg-[#111111]/[0.02]">
              <input
                type="checkbox"
                checked={safeMode}
                onChange={(e) => onSafeModeChange(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#FF3333]"
              />
              <div>
                <span className="text-[11px] text-[#111111]/50">Standard mode</span>
                <p className="text-[10px] leading-snug text-[#111111]/50">
                  {safeMode ? 'Citations skipped — toggle off for bibliography processing' : 'Citations active — uses bibliography references'}
                </p>
              </div>
            </label>

            <div className="mt-3 border-t border-[#e5e5e0] pt-3">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/50">Custom Font</p>
              {!hasTier(userTier, 'studio') ? (
                <a href="/pricing" className="flex items-center justify-center gap-2 border border-dashed border-[#e5e5e0] py-2.5 text-[11px] text-[#111111]/50 transition-all hover:border-[#111111]/20 hover:text-[#111111]/60">
                  <Lock className="h-3 w-3" />Studio — <span className="underline">Upgrade</span>
                </a>
              ) : customFont ? (
                <div className="flex items-center gap-2 bg-[#111111]/[0.03] px-3 py-2">
                  <span className="flex-1 truncate text-[11px] text-[#111111]/50">{customFont.originalName}</span>
                  <button
                    onClick={onFontRemove}
                    className="text-[#111111]/50 transition-colors hover:text-red-500/60"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className={`flex cursor-pointer items-center justify-center gap-2 border border-dashed border-[#111111]/[0.12] py-2.5 text-[11px] transition-all ${
                  fontUploading ? 'text-[#111111]/50' : 'text-[#111111]/50 hover:border-[#111111]/25 hover:text-[#111111]/70'
                }`}>
                  {fontUploading ? (
                    <><Loader2 className="h-3 w-3 animate-spin" />Uploading&hellip;</>
                  ) : (
                    <><Upload className="h-3 w-3" />Upload .ttf / .otf</>
                  )}
                  <input
                    id="font-upload"
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Dock */}
      <div className="flex items-center gap-1 border border-[#111111]/15 bg-white/95 p-1.5 shadow-elevated backdrop-blur-xl">
        <DockButton
          active={activeTab === 'style'}
          onClick={() => toggleTab('style')}
          icon={<Paintbrush className="h-3.5 w-3.5" />}
          label={TEMPLATE_INFO[template].subtitle}
        />
        <div className="mx-0.5 h-4 w-px bg-[#111111]/[0.08]" />
        <DockButton
          active={activeTab === 'layout'}
          onClick={() => toggleTab('layout')}
          icon={<Ruler className="h-3.5 w-3.5" />}
          label={PAGE_SIZES[pageSize]?.label || 'Size'}
        />
        <div className="mx-0.5 h-4 w-px bg-[#111111]/[0.08]" />
        <DockButton
          active={activeTab === 'settings'}
          onClick={() => toggleTab('settings')}
          icon={<Settings2 className="h-3.5 w-3.5" />}
          label="Options"
        />

        {/* Status dot */}
        <div className="mx-1.5 h-4 w-px bg-[#111111]/[0.08]" />
        <div className="flex items-center gap-1.5 px-2">
          <span className={`h-1.5 w-1.5 rounded-full transition-colors ${
            status === 'compiling' || status === 'queued' ? 'bg-[#FF3333] animate-pulse' :
            status === 'success' ? 'bg-emerald-500' :
            status === 'error' ? 'bg-red-500' :
            'bg-[#111111]/20'
          }`} />
          <span className={`font-mono text-[9px] uppercase tracking-[0.1em] ${
            status === 'compiling' || status === 'queued' ? 'text-[#FF3333]' :
            status === 'success' ? 'text-emerald-600/70' :
            status === 'error' ? 'text-red-500/70' :
            'text-[#111111]/55'
          }`}>
            {status === 'queued' ? 'Queued' : status === 'compiling' ? 'Setting' : status === 'success' ? 'Ready' : status === 'error' ? 'Issue' : 'Idle'}
          </span>
        </div>

        {/* Quality grade — visible after successful compile */}
        {status === 'success' && quality?.typographyGrade && (
          <>
            <div className="mx-1 h-4 w-px bg-[#111111]/[0.08]" />
            <div className={`flex items-center gap-1 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] ${
              quality.typographyGrade === 'A' ? 'text-emerald-600/70' :
              quality.typographyGrade === 'B' ? 'text-blue-600/70' :
              quality.typographyGrade === 'C' ? 'text-amber-600/70' :
              'text-red-500/70'
            }`}>
              <span className="font-bold">{quality.typographyGrade}</span>
              {(quality.typographyGrade === 'C' || quality.typographyGrade === 'D') && quality.overfullBoxes > 0 && (
                <span className="opacity-60">{quality.overfullBoxes} ovf</span>
              )}
            </div>
          </>
        )}
        {/* Engine indicator — shows typst after successful compile */}
        {status === 'success' && quality?.engine && (
          <>
            <div className="mx-0.5 h-4 w-px bg-[#111111]/[0.08]" />
            <span className="px-1.5 font-mono text-[8px] text-[#111111]/50" title={quality.engine}>
              {quality.engine}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
