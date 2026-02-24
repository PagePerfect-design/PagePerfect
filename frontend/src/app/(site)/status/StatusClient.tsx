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

/* ---------- tiny helpers ---------- */

function Dot({ color }: { color: 'green' | 'red' | 'muted' }) {
  const hex = color === 'green' ? '#16a34a' : color === 'red' ? '#dc2626' : '#111111'
  const opacity = color === 'muted' ? 0.25 : 1
  return (
    <span aria-hidden style={{ color: hex, opacity }} className="text-[10px] leading-none">
      &#x25CF;
    </span>
  )
}

function Badge({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] ${
        ok
          ? 'border border-[#16a34a] text-[#16a34a]'
          : 'border border-[#dc2626] text-[#dc2626]'
      }`}
    >
      {ok ? yes : no}
    </span>
  )
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
    <div className="space-y-6">
      {/* ── API Connectivity ── */}
      <div className="border border-[#111111] bg-white p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold tracking-tight text-[#111111]">
              API Connectivity
            </h2>
            <p className="mt-1 font-body text-sm text-[#555555]">
              Frontend calls{' '}
              <code className="border border-[#e5e5e0] bg-[#f5f5f0] px-1.5 py-0.5 font-mono text-[12px] text-[#111111]">
                /api/*
              </code>{' '}
              proxied to:
            </p>
            <p className="mt-1">
              <code className="border border-[#e5e5e0] bg-[#f5f5f0] px-1.5 py-0.5 font-mono text-[12px] text-[#111111] break-all">
                {apiBase || '(not set)'}
              </code>
            </p>
          </div>
          <Badge ok={ok} yes="Healthy" no="Unreachable" />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchAll()}
            disabled={loading}
            className="min-h-[44px] border border-[#111111] bg-[#111111] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white transition-colors duration-75 hover:bg-[#333333] disabled:opacity-50"
          >
            {loading ? 'Checking\u2026' : 'Re-check'}
          </button>
          {ts && (
            <span className="font-mono text-[11px] text-[#111111]/40">
              Last checked: {ts}
            </span>
          )}
          {error && (
            <span className="font-mono text-[11px] text-[#dc2626]">{error}</span>
          )}
        </div>
      </div>

      {/* ── Subsystem Readiness ── */}
      {readiness && (
        <div className="border border-[#111111] bg-white p-5 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="font-display text-lg font-bold tracking-tight text-[#111111]">
              Subsystem Readiness
            </h2>
            <Badge ok={readiness.ready} yes="All Systems Go" no="Degraded" />
          </div>
          <ul className="mt-4 divide-y divide-[#e5e5e0]">
            {Object.entries(readiness.checks).map(([key, value]) => (
              <li key={key} className="flex min-h-[44px] items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-3">
                  <Dot
                    color={
                      value === 'ok' ? 'green' : value === 'not_configured' ? 'muted' : 'red'
                    }
                  />
                  <span className="font-mono text-sm text-[#111111]">{key}</span>
                </div>
                <span
                  className={`font-mono text-[11px] ${
                    value === 'ok'
                      ? 'text-[#16a34a]'
                      : value === 'not_configured'
                        ? 'text-[#111111]/30'
                        : 'text-[#dc2626]'
                  }`}
                >
                  {value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Server Capabilities ── */}
      <div className="border border-[#111111] bg-white p-5 md:p-6">
        <h2 className="font-display text-lg font-bold tracking-tight text-[#111111] mb-4">
          Server Capabilities
        </h2>
        {!details?.ok ? (
          <p className="font-body text-sm text-[#555555]">
            No details endpoint or not available.
          </p>
        ) : (
          <>
            {/* Three-column list */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]">
                  Templates
                </p>
                <ul className="space-y-1">
                  {details.templates?.map(t => (
                    <li key={t} className="font-mono text-[12px] text-[#333333]">{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]">
                  Page Sizes
                </p>
                <ul className="space-y-1">
                  {details.pageSizes?.map(s => (
                    <li key={s} className="font-mono text-[12px] text-[#333333]">{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]">
                  Margin Presets
                </p>
                <ul className="space-y-1">
                  {details.marginPresets?.map(m => (
                    <li key={m} className="font-mono text-[12px] text-[#333333]">{m}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Font Availability */}
            <div className="mt-6 border-t border-[#e5e5e0] pt-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Dot
                    color={
                      !details.fonts ? 'muted' : details.fonts.ok ? 'green' : 'red'
                    }
                  />
                  <span className="font-display text-[15px] font-semibold text-[#111111]">
                    Typesetting Fonts
                  </span>
                </div>
                {details.fonts?.probeWorking && (
                  <span className="font-mono text-[11px] text-[#555555]">
                    {details.fonts.available}/{details.fonts.total} installed
                  </span>
                )}
              </div>
              <p className="mt-1 ml-5 font-body text-sm text-[#555555]">
                {details.pdfEngine === 'lualatex' ? 'LuaLaTeX' : 'XeLaTeX'} fonts required by the{' '}
                {details.templates?.length || 15} design templates.
              </p>

              {details.fonts && !details.fonts.probeWorking && (
                <p className="mt-1 ml-5 font-body text-sm text-[#111111]/40">
                  Font probing unavailable — fc-list not found on server.
                </p>
              )}

              {details.fonts?.criticalMissing && details.fonts.criticalMissing.length > 0 && (
                <ul className="mt-3 ml-5 divide-y divide-[#e5e5e0]">
                  {details.fonts.criticalMissing.map(f => (
                    <li key={f} className="flex min-h-[44px] items-center gap-3 py-2">
                      <Dot color="red" />
                      <span className="font-mono text-sm text-[#111111]">{f}</span>
                      <span className="font-mono text-[11px] text-[#dc2626]">
                        missing — compilation may fail
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {fontAudit && fontAudit.probeWorking && (
                <div className="mt-3 ml-5">
                  <button
                    onClick={() => setFontExpanded(!fontExpanded)}
                    className="min-h-[44px] font-mono text-[11px] text-[#FF3333] transition-colors duration-75 hover:text-[#E52222]"
                  >
                    {fontExpanded ? 'Hide' : 'Show'} full font inventory
                  </button>

                  {fontExpanded && (
                    <div className="mt-2 overflow-x-auto">
                      <ul className="divide-y divide-[#e5e5e0]">
                        {fontAudit.fonts.map(f => (
                          <li
                            key={f.name}
                            className="flex min-h-[44px] items-center justify-between gap-4 py-2"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Dot
                                color={
                                  f.available === true
                                    ? 'green'
                                    : f.available === false
                                      ? 'red'
                                      : 'muted'
                                }
                              />
                              <span className="font-mono text-sm text-[#111111] truncate">
                                {f.name}
                                {f.critical && (
                                  <span className="ml-1 text-[#FF3333]">*</span>
                                )}
                              </span>
                              <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/50">
                                {f.category}
                              </span>
                            </div>
                            <div className="shrink-0 text-right font-mono text-[11px] text-[#555555]">
                              {f.available === false && f.bestFallback ? (
                                <span className="text-[#dc2626]">
                                  fallback: {f.bestFallback}
                                </span>
                              ) : (
                                f.usedBy[0] || '\u00A0'
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 font-mono text-[10px] text-[#111111]/40">
                        * critical for template compilation
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/app"
          className="inline-flex min-h-[44px] items-center border border-[#FF3333] bg-[#FF3333] px-6 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white transition-colors duration-75 hover:bg-[#E52222]"
        >
          Open Editor
        </Link>
        <Link
          href="/docs"
          className="inline-flex min-h-[44px] items-center border border-[#111111] px-6 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111] transition-colors duration-75 hover:bg-[#111111] hover:text-white"
        >
          Documentation
        </Link>
      </div>
    </div>
  )
}
