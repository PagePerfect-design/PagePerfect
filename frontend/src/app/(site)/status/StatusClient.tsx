'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Details = {
  ok: boolean
  service?: string
  templates?: string[]
  pageSizes?: string[]
  marginPresets?: string[]
}

export default function StatusClient({ apiBase }: { apiBase: string }) {
  const [health, setHealth] = useState<Details | null>(null)
  const [details, setDetails] = useState<Details | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ts, setTs] = useState<string>('')

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      const [h, d] = await Promise.allSettled([
        fetch('/api/health').then(r => r.json()),
        fetch('/api/health/details').then(r => r.ok ? r.json() : Promise.resolve({ ok: false })),
      ])
      setHealth(h.status === 'fulfilled' ? h.value : { ok: false })
      setDetails(d.status === 'fulfilled' ? d.value : { ok: false })
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

      {/* Details card */}
      <div className="card p-5">
        <div className="text-xl font-bold text-text-primary mb-3">Server Capabilities</div>
        {!details?.ok ? (
          <p className="text-text-secondary">No details endpoint or not available. (Optional.)</p>
        ) : (
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
