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
      setError('Failed to contact API via /api/* (check rewrites and Railway).')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchAll() }, [])

  const ok = health?.ok === true

  return (
    <div className="grid gap-4">
      {/* Proxy / Env card */}
      <div className="rounded-lg border border-ens-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-bold text-ens-midnight mb-1">API Connectivity</div>
            <p className="text-ens-gray-700">
              Frontend calls <code className="rounded bg-ens-light px-2 py-1">/api/*</code> and Next.js rewrites proxy to:
            </p>
            <p className="mt-1"><code className="rounded bg-ens-light px-2 py-1">{apiBase || '(not set)'}</code></p>
          </div>
          <div>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${ok ? 'bg-ens-green text-white' : 'bg-red-600 text-white'}`}>
              {ok ? 'Healthy' : 'Unreachable'}
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button 
            onClick={() => fetchAll()} 
            disabled={loading}
            className="rounded-lg bg-ens-blue px-4 py-2 text-white font-semibold hover:bg-ens-blue/90 disabled:opacity-50"
          >
            {loading ? 'Checking…' : 'Re-check'}
          </button>
          {ts && <span className="text-sm font-mono text-ens-gray-600">Last checked: {ts}</span>}
          {error && <span className="text-sm font-mono text-red-700">{error}</span>}
        </div>
      </div>

      {/* Details card */}
      <div className="rounded-lg border border-ens-gray-200 bg-white p-5 shadow-sm">
        <div className="text-xl font-bold text-ens-midnight mb-3">Server Capabilities</div>
        {!details?.ok ? (
          <p className="text-ens-gray-700">No details endpoint or not available. (Optional.)</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="font-semibold">Templates</div>
              <ul className="mt-1 list-disc pl-5">
                {details.templates?.map(t => <li key={t}>{t}</li>)}
              </ul>
            </div>
            <div>
              <div className="font-semibold">Page sizes</div>
              <ul className="mt-1 list-disc pl-5">
                {details.pageSizes?.map(s => <li key={s}>{s}</li>)}
              </ul>
            </div>
            <div>
              <div className="font-semibold">Margin presets</div>
              <ul className="mt-1 list-disc pl-5">
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
          className="rounded-lg bg-ens-blue px-4 py-2 text-white font-semibold hover:bg-ens-blue/90"
        >
          Back to Editor
        </Link>
        <Link 
          href="/docs"
          className="rounded-lg border border-ens-gray-300 bg-white px-4 py-2 text-ens-midnight font-semibold hover:bg-ens-light"
        >
          Docs
        </Link>
      </div>
    </div>
  )
}
