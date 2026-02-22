'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type FontCheck = {
  ok: boolean
  total: number
  available: number
  missing: number
  criticalMissing: string[]
  probeWorking: boolean
}

type FontDetail = {
  name: string
  available: boolean | null
  category: string
  critical: boolean
  source: string
  usedBy: string[]
  bestFallback: string | null
}

type FontAudit = {
  total: number
  available: number
  missing: number
  unknown: number
  probeWorking: boolean
  fonts: FontDetail[]
}

type ReadinessChecks = {
  redis?: string
  pocketbase?: string
  pandoc?: string
  lualatex?: string
  disk?: string
}

type Readiness = {
  ready: boolean
  checks: ReadinessChecks
  timestamp: string
}

type Details = {
  ok: boolean
  service?: string
  pdfEngine?: string
  templates?: string[]
  pageSizes?: string[]
  marginPresets?: string[]
  fonts?: FontCheck
}

export default function StatusClient({ apiBase }: { apiBase: string }) {
  const [health, setHealth] = useState<Details | null>(null)
  const [readiness, setReadiness] = useState<Readiness | null>(null)
  const [details, setDetails] = useState<Details | null>(null)
  const [fontAudit, setFontAudit] = useState<FontAudit | null>(null)
  const [fontExpanded, setFontExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ts, setTs] = useState<string>('')

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      const [h, rd, d, f] = await Promise.allSettled([
        fetch('/api/health').then(r => r.json()),
        fetch('/api/health/ready').then(r => r.json()),
        fetch('/api/health/details').then(r => r.ok ? r.json() : Promise.resolve({ ok: false })),
        fetch('/api/fonts/status').then(r => r.ok ? r.json() : Promise.resolve(null)),
      ])
      setHealth(h.status === 'fulfilled' ? h.value : { ok: false })
      setReadiness(rd.status === 'fulfilled' ? rd.value : null)
      setDetails(d.status === 'fulfilled' ? d.value : { ok: false })
      setFontAudit(f.status === 'fulfilled' ? f.value : null)
      setTs(new Date().toLocaleString())
    } catch {
      setError('Failed to contact API via /api/* (check rewrites and backend URL).')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchAll() }, [])

  const ok = health?.ok === true

  return (
    <div className="grid gap-4">
      {/* Proxy / Env card */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-bold text-text-primary mb-1">API Connectivity</div>
            <p className="text-text-secondary">
              Frontend calls <code className="rounded bg-surface-subtle px-2 py-1 text-accent text-sm font-mono">/api/*</code> and Next.js rewrites proxy to:
            </p>
            <p className="mt-1"><code className="rounded bg-surface-subtle px-2 py-1 text-accent text-sm font-mono">{apiBase || '(not set)'}</code></p>
          </div>
          <div>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${ok ? 'bg-success text-surface' : 'bg-danger text-surface'}`}>
              {ok ? 'Healthy' : 'Unreachable'}
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => fetchAll()}
            disabled={loading}
            className="btn-pill btn-primary disabled:opacity-50"
          >
            {loading ? 'Checking\u2026' : 'Re-check'}
          </button>
          {ts && <span className="text-sm font-mono text-text-ghost">Last checked: {ts}</span>}
          {error && <span className="text-sm font-mono text-danger">{error}</span>}
        </div>
      </div>

      {/* Readiness probe card */}
      {readiness && (
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="text-xl font-bold text-text-primary">Subsystem Readiness</div>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${readiness.ready ? 'bg-success text-surface' : 'bg-danger text-surface'}`}>
              {readiness.ready ? 'All Systems Go' : 'Degraded'}
            </span>
          </div>
          <ul className="divide-y divide-border">
            {Object.entries(readiness.checks).map(([key, value]) => (
              <li key={key} className="py-2 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span aria-hidden>
                    {value === 'ok' ? (
                      <span className="text-success">&#x25CF;</span>
                    ) : value === 'not_configured' ? (
                      <span className="text-text-ghost">&#x25CF;</span>
                    ) : (
                      <span className="text-danger">&#x25CF;</span>
                    )}
                  </span>
                  <span className="font-mono text-sm text-text-primary">{key}</span>
                </div>
                <span className={`font-mono text-[11px] ${
                  value === 'ok' ? 'text-success' :
                  value === 'not_configured' ? 'text-text-ghost' :
                  'text-danger'
                }`}>
                  {value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Details card */}
      <div className="card p-5">
        <div className="text-xl font-bold text-text-primary mb-3">Server Capabilities</div>
        {!details?.ok ? (
          <p className="text-text-secondary">No details endpoint or not available. (Optional.)</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="font-semibold text-text-primary">Templates</div>
                <ul className="mt-1 list-disc pl-5 text-text-secondary">
                  {details.templates?.map(t => <li key={t}>{t}</li>)}
                </ul>
              </div>
              <div>
                <div className="font-semibold text-text-primary">Page sizes</div>
                <ul className="mt-1 list-disc pl-5 text-text-secondary">
                  {details.pageSizes?.map(s => <li key={s}>{s}</li>)}
                </ul>
              </div>
              <div>
                <div className="font-semibold text-text-primary">Margin presets</div>
                <ul className="mt-1 list-disc pl-5 text-text-secondary">
                  {details.marginPresets?.map(m => <li key={m}>{m}</li>)}
                </ul>
              </div>
            </div>

            {/* Font Availability — subsection of Server Capabilities */}
            <div className="divider my-4" />
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-3">
                <span aria-hidden>
                  {!details.fonts ? (
                    <span className="text-text-ghost">&#x25CF;</span>
                  ) : details.fonts.ok ? (
                    <span className="text-success">&#x25CF;</span>
                  ) : (
                    <span className="text-danger">&#x25CF;</span>
                  )}
                </span>
                <span className="font-semibold text-text-primary">Typesetting Fonts</span>
              </div>
              {details.fonts?.probeWorking && (
                <span className="font-mono text-[11px] text-text-tertiary">
                  {details.fonts.available}/{details.fonts.total} installed
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary ml-6 mb-2">
              {details.pdfEngine === 'lualatex' ? 'LuaLaTeX' : 'XeLaTeX'} fonts required by the {details.templates?.length || 15} design templates.
            </p>

            {details.fonts && !details.fonts.probeWorking && (
              <p className="text-sm text-text-ghost ml-6">
                Font probing unavailable — fc-list not found on server.
              </p>
            )}

            {details.fonts?.criticalMissing && details.fonts.criticalMissing.length > 0 && (
              <ul className="divide-y divide-border ml-6 mb-2">
                {details.fonts.criticalMissing.map(f => (
                  <li key={f} className="py-1.5 flex items-center gap-3">
                    <span className="text-danger" aria-hidden>&#x25CF;</span>
                    <span className="font-mono text-sm text-text-primary">{f}</span>
                    <span className="font-mono text-[11px] text-danger">missing — compilation may fail</span>
                  </li>
                ))}
              </ul>
            )}

            {fontAudit && fontAudit.probeWorking && (
              <div className="ml-6">
                <button
                  onClick={() => setFontExpanded(!fontExpanded)}
                  className="text-sm text-accent hover:text-accent-hover transition-colors"
                >
                  {fontExpanded ? 'Hide' : 'Show'} full font inventory
                </button>

                {fontExpanded && (
                  <ul className="divide-y divide-border mt-2">
                    {fontAudit.fonts.map(f => (
                      <li key={f.name} className="py-1.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <span aria-hidden>
                            {f.available === true && <span className="text-success">&#x25CF;</span>}
                            {f.available === false && <span className="text-danger">&#x25CF;</span>}
                            {f.available === null && <span className="text-text-ghost">&#x25CF;</span>}
                          </span>
                          <span className="font-mono text-sm text-text-primary truncate">
                            {f.name}
                            {f.critical && <span className="text-warning ml-1">*</span>}
                          </span>
                          <span className="label-mono shrink-0">{f.category}</span>
                        </div>
                        <div className="text-right font-mono text-[11px] text-text-secondary truncate shrink-0">
                          {f.available === false && f.bestFallback
                            ? <span className="text-warning">fallback: {f.bestFallback}</span>
                            : f.usedBy[0] || '\u00A0'}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {fontExpanded && (
                  <p className="caption mt-2">* critical for template compilation</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Links */}
      <div className="flex gap-3">
        <Link
          href="/app"
          className="btn-pill btn-primary"
        >
          Back to Editor
        </Link>
        <Link
          href="/docs"
          className="btn-pill btn-secondary"
        >
          Docs
        </Link>
      </div>
    </div>
  )
}
