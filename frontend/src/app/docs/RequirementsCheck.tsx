'use client'
import { useState } from 'react'
import Button from '@/components/Button'

type Check = {
  key: string
  label: string
  status: 'idle' | 'ok' | 'fail' | 'running'
  note?: string
}

const MINIMAL_MD = `# Test\n\nThis is a minimal test.`
const PASS_ICON = <span className="text-ens-green">●</span>
const FAIL_ICON = <span className="text-red-600">●</span>
const RUN_ICON  = <span className="text-ens-blue animate-pulse">●</span>
const IDLE_ICON = <span className="text-ens-gray-300">●</span>

export default function RequirementsCheck() {
  const [checks, setChecks] = useState<Check[]>([
    { key: 'proxy',  label: 'Proxy rewrite (/api → Railway) reachable', status: 'idle' },
    { key: 'health', label: 'Backend /health OK',                     status: 'idle' },
    { key: 'compile',label: 'Minimal PDF compile OK (safe, fast)',    status: 'idle' },
  ])
  const [ts, setTs] = useState<string>('')

  function icon(s: Check['status']) {
    return s === 'ok' ? PASS_ICON : s === 'fail' ? FAIL_ICON : s === 'running' ? RUN_ICON : IDLE_ICON
  }

  async function run() {
    setTs(new Date().toLocaleString())
    const set = (key: string, patch: Partial<Check>) =>
      setChecks(cs => cs.map(c => (c.key === key ? { ...c, ...patch } : c)))

    // 1) Proxy: /api/health (should hit Railway via Next rewrite)
    set('proxy', { status: 'running', note: '' })
    let healthJson: { ok?: boolean } | null = null
    try {
      const res = await fetch('/api/health', { method: 'GET' })
      healthJson = await res.json().catch(() => ({}))
      if (res.ok && healthJson?.ok) {
        set('proxy', { status: 'ok', note: 'Rewrites active' })
      } else {
        set('proxy', { status: 'fail', note: `Status ${res.status}` })
      }
    } catch {
      set('proxy', { status: 'fail', note: 'Network error' })
    }

    // 2) Health explicitly (redundant but clearer)
    set('health', { status: 'running', note: '' })
    try {
      const res = await fetch('/api/health')
      const json = await res.json().catch(() => ({}))
      if (res.ok && json?.ok) {
        set('health', { status: 'ok', note: json?.service || 'backend' })
      } else {
        set('health', { status: 'fail', note: `Status ${res.status}` })
      }
    } catch {
      set('health', { status: 'fail', note: 'Network error' })
    }

    // 3) Minimal compile (safe mode + fast mode; tiny markdown)
    set('compile', { status: 'running', note: '' })
    try {
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manuscriptText: MINIMAL_MD,
          template: 'chicago',
          title: 'Verification',
          pageSize: 'a4',
          marginPreset: 'normal',
          safeMode: true,
          compileMode: 'fast',
        }),
      })
      const ct = res.headers.get('content-type') || ''
      if (res.ok && ct.includes('application/pdf')) {
        set('compile', { status: 'ok', note: 'PDF streamed' })
      } else {
        const j = await res.json().catch(() => ({}))
        set('compile', { status: 'fail', note: j?.message ? String(j.message) : `Status ${res.status}` })
      }
    } catch {
      set('compile', { status: 'fail', note: 'Network error' })
    }
  }

  return (
    <div className="card p-5">
      <div className="h2 mb-2">Requirements</div>
      <p className="p text-ens-gray-700 mb-3">
        Verifies the frontend proxy, backend health, and a minimal compile path. Useful for Vercel + Railway sanity checks.
      </p>

      <ul className="divide-y">
        {checks.map((c) => (
          <li key={c.key} className="py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span aria-hidden>{icon(c.status)}</span>
              <span>{c.label}</span>
            </div>
            <div className="small-mono text-right text-ens-gray-700">
              {c.note || '\u00A0'}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={() => void run()}>Run checks</Button>
        {ts && <span className="small-mono">Last run: {ts}</span>}
      </div>
    </div>
  )
}
