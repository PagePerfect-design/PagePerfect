'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Quote,
  ImageIcon,
  Wrench,
  Globe2,
  Fingerprint,
  Palette,
  BarChart3,
  Languages,
  Printer,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  Info,
  X,
  Loader2,
  Shield,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

type AnalysisStatus = 'idle' | 'loading' | 'done' | 'error'
type SystemKey =
  | 'structure'
  | 'references'
  | 'assets'
  | 'engineering'
  | 'platform'
  | 'provenance'
  | 'extensions'
  | 'typography'
  | 'multilingual'
  | 'printQA'

type StatusIcon = 'pass' | 'warn' | 'fail' | 'info' | 'pending'

type CheckItem = {
  name: string
  status: string
  detail: string
}

type SystemConfig = {
  key: SystemKey
  label: string
  shortLabel: string
  icon: React.ReactNode
  description: string
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type FullAnalysis = {
  structure?: any
  assets?: any
  lint?: any
  typography?: any
  multilingual?: any
  printQA?: any
  platform?: any
  provenance?: any
  summary?: any
} | null

/* ═══════════════════════════════════════════════════════════════════
   SYSTEM DEFINITIONS
   ═══════════════════════════════════════════════════════════════════ */

const SYSTEMS: SystemConfig[] = [
  { key: 'structure',    label: 'Manuscript Structure',   shortLabel: 'Structure',   icon: <BookOpen className="h-3.5 w-3.5" />,    description: 'Front matter, body, and back matter architecture' },
  { key: 'references',   label: 'References & Citations', shortLabel: 'References',  icon: <Quote className="h-3.5 w-3.5" />,       description: 'Citation validation, duplicate detection, normalization' },
  { key: 'assets',       label: 'Figures & Assets',       shortLabel: 'Assets',      icon: <ImageIcon className="h-3.5 w-3.5" />,       description: 'Image pipeline, DPI, captions, cross-references' },
  { key: 'engineering',  label: 'Book Engineering',       shortLabel: 'Engineering', icon: <Wrench className="h-3.5 w-3.5" />,      description: 'Widows/orphans, hyphenation, manuscript linting' },
  { key: 'typography',   label: 'Typography Assurance',   shortLabel: 'Typography',  icon: <BarChart3 className="h-3.5 w-3.5" />,   description: 'Baseline grid, heading scale, typographic report' },
  { key: 'platform',     label: 'Platform Compliance',    shortLabel: 'Platform',    icon: <Globe2 className="h-3.5 w-3.5" />,      description: 'KDP, IngramSpark, Lulu, offset, academic, ebook' },
  { key: 'extensions',   label: 'Template Extensions',    shortLabel: 'Extensions',  icon: <Palette className="h-3.5 w-3.5" />,     description: 'Safe typographic overrides within design system' },
  { key: 'multilingual', label: 'Multilingual Support',   shortLabel: 'Languages',   icon: <Languages className="h-3.5 w-3.5" />,   description: 'RTL, mixed direction, script detection, font fallback' },
  { key: 'printQA',      label: 'Print QA',               shortLabel: 'Print QA',    icon: <Printer className="h-3.5 w-3.5" />,     description: 'Ink coverage, contrast, small text, paper stock' },
  { key: 'provenance',   label: 'Build Provenance',       shortLabel: 'Provenance',  icon: <Fingerprint className="h-3.5 w-3.5" />, description: 'Build metadata, content hash, reproducible exports' },
]

/* ═══════════════════════════════════════════════════════════════════
   STATUS HELPERS
   ═══════════════════════════════════════════════════════════════════ */

function StatusBadge({ status }: { status: StatusIcon }) {
  switch (status) {
    case 'pass':
      return <Check className="h-3 w-3 text-emerald-500" />
    case 'warn':
      return <AlertTriangle className="h-3 w-3 text-amber-500" />
    case 'fail':
      return <X className="h-3 w-3 text-red-500" />
    case 'info':
      return <Info className="h-3 w-3 text-blue-500" />
    default:
      return <span className="h-2 w-2 bg-[#111111]/10" />
  }
}

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const circumference = 2 * Math.PI * 16
  const offset = circumference - (score / 100) * circumference
  const color = score >= 90 ? '#34d399' : score >= 75 ? '#fbbf24' : score >= 60 ? '#fb923c' : '#f87171'

  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(17,17,17,0.08)" strokeWidth="2" />
        <circle
          cx="18" cy="18" r="16" fill="none"
          stroke={color} strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="font-display text-sm font-bold" style={{ color }}>{grade}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   INDIVIDUAL SYSTEM PANELS
   ═══════════════════════════════════════════════════════════════════ */

function CheckList({ checks }: { checks: CheckItem[] }) {
  if (!checks || checks.length === 0) return null
  return (
    <div className="space-y-1.5">
      {checks.map((check, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="mt-0.5 shrink-0">
            <StatusBadge status={check.status as StatusIcon} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-[#111111]/50">{check.name}</span>
            <p className="text-[10px] leading-[1.5] text-[#111111]/35">{check.detail}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function StructurePanel({ data }: { data: any }) {
  if (!data) return null
  const { sections, warnings, suggestions, structure } = data
  return (
    <div className="space-y-3">
      {/* Section map */}
      <div className="grid grid-cols-3 gap-px overflow-hidden bg-[#111111]/[0.04]">
        <div className="bg-white p-2.5">
          <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#111111]/20">Front Matter</p>
          <p className="mt-1 text-[11px] font-medium text-[#111111]/60">{structure.frontMatter.length || '—'}</p>
        </div>
        <div className="bg-white p-2.5">
          <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#111111]/20">Body</p>
          <p className="mt-1 text-[11px] font-medium text-[#111111]/60">{structure.chapterCount} chapters</p>
        </div>
        <div className="bg-white p-2.5">
          <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#111111]/20">Back Matter</p>
          <p className="mt-1 text-[11px] font-medium text-[#111111]/60">{structure.backMatter.length || '—'}</p>
        </div>
      </div>

      {/* Detected sections */}
      {sections.length > 0 && (
        <div className="space-y-1">
          {sections.map((s: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              <span className={`h-1.5 w-1.5 rounded-full ${s.matter === 'front' ? 'bg-blue-500' : s.matter === 'body' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-[#111111]/40">{s.label}</span>
              <span className="text-[#111111]/20">line {s.line}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warnings & suggestions */}
      {warnings.length > 0 && (
        <div className="space-y-1 border-t border-[#111111]/[0.06] pt-2">
          {warnings.map((w: any, i: number) => (
            <div key={i} className="flex items-start gap-2 text-[10px]">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
              <span className="text-amber-500/70">{w.message}</span>
            </div>
          ))}
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="space-y-1 border-t border-[#111111]/[0.06] pt-2">
          {suggestions.map((s: any, i: number) => (
            <div key={i} className="flex items-start gap-2 text-[10px]">
              <Info className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" />
              <span className="text-blue-500/70">{s.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TypographyPanel({ data }: { data: any }) {
  if (!data) return null
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <ScoreRing score={data.score} grade={data.grade} />
        <div>
          <p className="text-[12px] font-medium text-[#111111]/60">Typography Score</p>
          <p className="text-[10px] text-[#111111]/30">{data.score}/100 — {data.checks.filter((c: any) => c.status === 'pass').length}/{data.checks.length} checks passed</p>
        </div>
      </div>
      <CheckList checks={data.checks} />
    </div>
  )
}

function PrintQAPanel({ data }: { data: any }) {
  if (!data) return null
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <ScoreRing score={data.score} grade={data.grade} />
        <div>
          <p className="text-[12px] font-medium text-[#111111]/60">Print Quality Score</p>
          <p className="text-[10px] text-[#111111]/30">{data.score}/100</p>
        </div>
      </div>
      <CheckList checks={data.checks} />
      {data.recommendations?.length > 0 && (
        <div className="space-y-1 border-t border-[#111111]/[0.06] pt-2">
          <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#111111]/20">Recommendations</p>
          {data.recommendations.map((r: string, i: number) => (
            <p key={i} className="text-[10px] leading-[1.5] text-[#111111]/35">• {r}</p>
          ))}
        </div>
      )}
    </div>
  )
}

function AssetsPanel({ data }: { data: any }) {
  if (!data) return null
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-px overflow-hidden bg-[#111111]/[0.04]">
        {[
          { label: 'Figures', value: data.stats.figureCount },
          { label: 'Tables', value: data.stats.tableCount },
          { label: 'External', value: data.stats.externalImages },
          { label: 'No Caption', value: data.stats.missingCaptions },
        ].map(s => (
          <div key={s.label} className="bg-white p-2">
            <p className="font-mono text-[7px] uppercase tracking-[0.15em] text-[#111111]/20">{s.label}</p>
            <p className="mt-0.5 text-[12px] font-bold text-[#111111]/60">{s.value}</p>
          </div>
        ))}
      </div>
      {data.issues?.length > 0 && (
        <div className="space-y-1">
          {data.issues.slice(0, 8).map((issue: any, i: number) => (
            <div key={i} className="flex items-start gap-2 text-[10px]">
              <StatusBadge status={issue.severity as StatusIcon} />
              <span className="text-[#111111]/35">{issue.message}</span>
            </div>
          ))}
          {data.issues.length > 8 && (
            <p className="text-[9px] text-[#111111]/20">+ {data.issues.length - 8} more issues</p>
          )}
        </div>
      )}
    </div>
  )
}

function LintPanel({ data }: { data: any }) {
  if (!data) return null
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-px overflow-hidden bg-[#111111]/[0.04]">
        {[
          { label: 'Issues', value: data.stats.totalIssues, color: data.stats.totalIssues > 0 ? 'text-amber-500' : 'text-emerald-500' },
          { label: 'Warnings', value: data.stats.bySeverity?.warn || 0 },
          { label: 'Info', value: data.stats.bySeverity?.info || 0 },
        ].map(s => (
          <div key={s.label} className="bg-white p-2">
            <p className="font-mono text-[7px] uppercase tracking-[0.15em] text-[#111111]/20">{s.label}</p>
            <p className={`mt-0.5 text-[12px] font-bold ${s.color || 'text-[#111111]/60'}`}>{s.value}</p>
          </div>
        ))}
      </div>
      {data.issues?.length > 0 && (
        <div className="space-y-1">
          {data.issues.slice(0, 6).map((issue: any, i: number) => (
            <div key={i} className="flex items-start gap-2 text-[10px]">
              <StatusBadge status={issue.severity as StatusIcon} />
              <div>
                <span className="text-[#111111]/40">{issue.message}</span>
                {issue.fix && <p className="text-[#111111]/25">{issue.fix}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MultilingualPanel({ data }: { data: any }) {
  if (!data) return null
  const { scriptAnalysis, recommendations } = data
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {scriptAnalysis.scripts.map((s: any) => (
          <span key={s.script} className="inline-flex items-center gap-1 bg-[#111111]/[0.04] px-2 py-0.5 text-[10px]">
            <span className={`h-1.5 w-1.5 rounded-full ${s.direction === 'rtl' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className="text-[#111111]/40">{s.label}</span>
            <span className="text-[#111111]/20">{s.percentage}%</span>
          </span>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-px overflow-hidden bg-[#111111]/[0.04]">
        {[
          { label: 'RTL', value: scriptAnalysis.hasRTL ? 'Yes' : 'No' },
          { label: 'Mixed Dir', value: scriptAnalysis.hasMixedDirection ? 'Yes' : 'No' },
          { label: 'Diacritics', value: scriptAnalysis.hasDiacritics ? 'Yes' : 'No' },
        ].map(s => (
          <div key={s.label} className="bg-white p-2">
            <p className="font-mono text-[7px] uppercase tracking-[0.15em] text-[#111111]/20">{s.label}</p>
            <p className="mt-0.5 text-[11px] font-medium text-[#111111]/60">{s.value}</p>
          </div>
        ))}
      </div>
      {recommendations?.length > 0 && (
        <div className="space-y-1">
          {recommendations.map((r: any, i: number) => (
            <div key={i} className="flex items-start gap-2 text-[10px]">
              <StatusBadge status={r.severity as StatusIcon} />
              <span className="text-[#111111]/35">{r.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PlatformPanel({ data }: { data: any }) {
  if (!data) return null
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Shield className={`h-4 w-4 ${data.passed ? 'text-emerald-500' : 'text-amber-500'}`} />
        <p className="text-[12px] font-medium text-[#111111]/60">{data.platform}</p>
        <span className={`px-2 py-0.5 text-[9px] font-medium ${data.passed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
          {data.passed ? 'PASSED' : 'ISSUES'}
        </span>
      </div>
      <CheckList checks={data.checks} />
      {data.recommendations?.length > 0 && (
        <div className="space-y-1 border-t border-[#111111]/[0.06] pt-2">
          {data.recommendations.map((r: string, i: number) => (
            <p key={i} className="text-[10px] leading-[1.5] text-[#111111]/35">• {r}</p>
          ))}
        </div>
      )}
    </div>
  )
}

function ProvenancePanel({ data }: { data: any }) {
  if (!data) return null
  return (
    <div className="space-y-2">
      <div className="bg-[#111111]/[0.02] p-3 font-mono text-[10px] leading-[1.8]">
        <div className="flex justify-between"><span className="text-[#111111]/25">Build ID</span><span className="text-[#111111]/40">{data.buildId}</span></div>
        <div className="flex justify-between"><span className="text-[#111111]/25">Content Hash</span><span className="text-[#111111]/40">{data.contentHash}</span></div>
        <div className="flex justify-between"><span className="text-[#111111]/25">Settings Hash</span><span className="text-[#111111]/40">{data.settingsHash}</span></div>
        <div className="flex justify-between"><span className="text-[#111111]/25">Template</span><span className="text-[#111111]/40">{data.config?.template}</span></div>
        <div className="flex justify-between"><span className="text-[#111111]/25">Page Size</span><span className="text-[#111111]/40">{data.config?.pageSize}</span></div>
        <div className="flex justify-between"><span className="text-[#111111]/25">Words</span><span className="text-[#111111]/40">{data.wordCount?.toLocaleString()}</span></div>
        <div className="flex justify-between"><span className="text-[#111111]/25">Engine</span><span className="text-[#111111]/40">{data.system?.engine} {data.system?.version}</span></div>
      </div>
    </div>
  )
}

function ExtensionsPanel({ data }: { data: any }) {
  // Show available tokens (from /api/template-tokens)
  if (!data) return (
    <p className="text-[10px] text-[#111111]/30">Template extension tokens allow safe overrides of typography, spacing, and heading styles within the design system&apos;s constraints.</p>
  )
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([key, schema]: [string, any]) => (
        <div key={key} className="flex items-center justify-between text-[10px]">
          <span className="text-[#111111]/35">{schema.label}</span>
          <span className="font-mono text-[#111111]/20">{schema.default}{schema.unit ? schema.unit : ''}</span>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PANEL
   ═══════════════════════════════════════════════════════════════════ */

export default function PublishingSystems({
  manuscript,
  template,
  pageSize,
  marginPreset,
  visible,
  onClose,
}: {
  manuscript: string
  template: string
  pageSize: string
  marginPreset: string
  visible: boolean
  onClose: () => void
}) {
  const [status, setStatus] = useState<AnalysisStatus>('idle')
  const [analysis, setAnalysis] = useState<FullAnalysis>(null)
  const [expandedSystem, setExpandedSystem] = useState<SystemKey | null>(null)
  const [tokenSchema, setTokenSchema] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = useCallback(async () => {
    if (!manuscript || manuscript.length < 10) return
    setStatus('loading')
    setError(null)

    try {
      const resp = await fetch('/api/analyze/full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manuscriptText: manuscript,
          template,
          pageSize,
          marginPreset,
          platform: 'kdp',
          paperStock: 'white',
          colorMode: 'bw',
        }),
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ message: 'Analysis failed.' }))
        throw new Error(err.message || 'Analysis failed')
      }

      const data = await resp.json()
      setAnalysis(data)
      setStatus('done')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
      setStatus('error')
    }
  }, [manuscript, template, pageSize, marginPreset])

  // Fetch token schema when template changes
  useEffect(() => {
    if (!visible) return
    fetch(`/api/template-tokens/${template}`)
      .then(r => r.json())
      .then(data => setTokenSchema(data.tokens))
      .catch(() => {})
  }, [template, visible])

  // Auto-run analysis when panel opens
  useEffect(() => {
    if (visible && status === 'idle' && manuscript.length > 10) {
      runAnalysis()
    }
  }, [visible, status, manuscript, runAnalysis])

  if (!visible) return null

  const toggleSystem = (key: SystemKey) => {
    setExpandedSystem(expandedSystem === key ? null : key)
  }

  function renderSystemContent(key: SystemKey) {
    if (!analysis) return <p className="text-[10px] text-[#111111]/20">Run analysis to see results.</p>

    switch (key) {
      case 'structure':    return <StructurePanel data={analysis.structure} />
      case 'references':   return <StructurePanel data={analysis.structure} /> // references in full analysis uses cross-ref
      case 'assets':       return <AssetsPanel data={analysis.assets} />
      case 'engineering':  return <LintPanel data={analysis.lint} />
      case 'typography':   return <TypographyPanel data={analysis.typography} />
      case 'platform':     return <PlatformPanel data={analysis.platform} />
      case 'multilingual': return <MultilingualPanel data={analysis.multilingual} />
      case 'printQA':      return <PrintQAPanel data={analysis.printQA} />
      case 'provenance':   return <ProvenancePanel data={analysis.provenance} />
      case 'extensions':   return <ExtensionsPanel data={tokenSchema} />
      default:             return null
    }
  }

  function getSystemStatus(key: SystemKey): StatusIcon {
    if (!analysis?.summary) return 'pending'
    switch (key) {
      case 'typography':
        return analysis.summary.typographyGrade === 'A' ? 'pass' : analysis.summary.typographyGrade === 'B' ? 'pass' : 'warn'
      case 'printQA':
        return analysis.summary.printQAGrade === 'A' ? 'pass' : analysis.summary.printQAGrade === 'B' ? 'pass' : 'warn'
      case 'engineering':
        return analysis.summary.lintIssues === 0 ? 'pass' : analysis.summary.lintIssues <= 3 ? 'info' : 'warn'
      case 'platform':
        return analysis.summary.platformPassed === true ? 'pass' : analysis.summary.platformPassed === false ? 'warn' : 'info'
      case 'multilingual':
        return analysis.summary.isMultiscript ? 'info' : 'pass'
      case 'assets':
        return analysis.summary.figureCount > 0 ? 'info' : 'pass'
      default:
        return 'pass'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="fixed right-0 top-[3.5rem] bottom-0 z-40 w-[380px] border-l border-[#111111]/[0.06] bg-white/95 backdrop-blur-xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#111111]/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#FF3333]" />
          <span className="font-display text-sm font-semibold text-[#111111]/80">Publishing Systems</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runAnalysis}
            disabled={status === 'loading'}
            className="flex h-7 items-center gap-1.5 bg-[#FF3333]/10 px-3 text-[10px] font-medium text-[#FF3333] transition-colors hover:bg-[#FF3333]/20 disabled:opacity-50"
          >
            {status === 'loading' ? <Loader2 className="h-3 w-3 animate-spin" /> : <BarChart3 className="h-3 w-3" />}
            {status === 'loading' ? 'Analyzing...' : 'Analyze'}
          </button>
          <button onClick={onClose} className="text-[#111111]/25 hover:text-[#111111]/40">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {analysis?.summary && (
        <div className="grid grid-cols-4 gap-px bg-[#111111]/[0.04] border-b border-[#111111]/[0.06]">
          {[
            { label: 'Typo', value: analysis.summary.typographyGrade, color: analysis.summary.typographyGrade === 'A' ? 'text-emerald-500' : 'text-amber-500' },
            { label: 'QA', value: analysis.summary.printQAGrade, color: analysis.summary.printQAGrade === 'A' ? 'text-emerald-500' : 'text-amber-500' },
            { label: 'Lint', value: analysis.summary.lintIssues, color: analysis.summary.lintIssues === 0 ? 'text-emerald-500' : 'text-amber-500' },
            { label: 'KDP', value: analysis.summary.platformPassed ? '✓' : '—', color: analysis.summary.platformPassed ? 'text-emerald-500' : 'text-[#111111]/25' },
          ].map(s => (
            <div key={s.label} className="bg-white px-2 py-2 text-center">
              <p className="font-mono text-[7px] uppercase tracking-[0.15em] text-[#111111]/20">{s.label}</p>
              <p className={`mt-0.5 font-display text-sm font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mx-4 mt-3 border border-red-500/20 bg-red-500/5 px-3 py-2">
          <p className="font-mono text-[10px] text-red-500">{error}</p>
        </div>
      )}

      {/* System accordion */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {SYSTEMS.map((sys) => (
            <div key={sys.key} className="mb-1">
              <button
                onClick={() => toggleSystem(sys.key)}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-all ${
                  expandedSystem === sys.key
                    ? 'bg-[#111111]/[0.04]'
                    : 'hover:bg-[#111111]/[0.02]'
                }`}
              >
                <span className="shrink-0 text-[#111111]/30">{sys.icon}</span>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-medium text-[#111111]/50">{sys.label}</span>
                </div>
                <StatusBadge status={getSystemStatus(sys.key)} />
                {expandedSystem === sys.key
                  ? <ChevronUp className="h-3 w-3 shrink-0 text-[#111111]/20" />
                  : <ChevronDown className="h-3 w-3 shrink-0 text-[#111111]/20" />
                }
              </button>

              <AnimatePresence>
                {expandedSystem === sys.key && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-1">
                      <p className="mb-2 text-[9px] text-[#111111]/20">{sys.description}</p>
                      {status === 'loading' ? (
                        <div className="flex items-center gap-2 py-3">
                          <Loader2 className="h-3 w-3 animate-spin text-[#111111]/20" />
                          <span className="text-[10px] text-[#111111]/20">Analyzing...</span>
                        </div>
                      ) : (
                        renderSystemContent(sys.key)
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
