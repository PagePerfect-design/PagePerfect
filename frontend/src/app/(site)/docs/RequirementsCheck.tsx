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
const PASS_ICON = <span className="text-success">●</span>
const FAIL_ICON = <span className="text-danger">●</span>
const RUN_ICON  = <span className="text-accent animate-pulse">●</span>
const IDLE_ICON = <span className="text-text-ghost">●</span>

function diagnose(status: number): string {
  if (status === 404) return 'API proxy not reaching backend — check API_BASE_URL env var on Vercel'
  if (status === 502 || status === 503) return 'Backend is down or unreachable'
  if (status === 504) return 'Backend timed out — server may be overloaded'
  if (status >= 400) return `Unexpected status ${status}`
  return `Status ${status}`
}

export default function RequirementsCheck() {
  const [checks, setChecks] = useState<Check[]>([
    { key: 'health', label: 'Backend API reachable',                  status: 'idle' },
    { key: 'compile', label: 'PDF compile working',                   status: 'idle' },
  ])
  const [ts, setTs] = useState<string>('')

  function icon(s: Check['status']) {
    return s === 'ok' ? PASS_ICON : s === 'fail' ? FAIL_ICON : s === 'running' ? RUN_ICON : IDLE_ICON
  }

  async function run() {
    setTs(new Date().toLocaleString())
    const set = (key: string, patch: Partial<Check>) =>
      setChecks(cs => cs.map(c => (c.key === key ? { ...c, ...patch } : c)))

    // 1) Backend health via proxy rewrite
    set('health', { status: 'running', note: '' })
    let backendOk = false
    try {
      const res = await fetch('/api/health', { method: 'GET' })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json?.ok) {
        set('health', { status: 'ok', note: json?.service || 'Connected' })
        backendOk = true
      } else {
        set('health', { status: 'fail', note: diagnose(res.status) })
      }
    } catch {
      set('health', { status: 'fail', note: 'Network error — backend unreachable' })
    }

    // 2) Minimal compile (only attempt if health passed)
    set('compile', { status: 'running', note: '' })
    if (!backendOk) {
      set('compile', { status: 'fail', note: 'Skipped — backend not available' })
      return
    }
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
        set('compile', { status: 'ok', note: 'PDF generated' })
      } else {
        const j = await res.json().catch(() => ({}))
        set('compile', { status: 'fail', note: j?.message ? String(j.message) : diagnose(res.status) })
      }
    } catch {
      set('compile', { status: 'fail', note: 'Network error during compile' })
    }
  }

  return (
    <div className="card p-5">
      <div className="text-lg font-bold text-text-primary mb-2">System Check</div>
      <p className="text-sm text-text-secondary mb-3">
        Tests the API proxy and compile pipeline. If checks fail, the backend may be starting up — wait 30 seconds and retry.
      </p>

      <ul className="divide-y divide-border">
        {checks.map((c) => (
          <li key={c.key} className="py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <span aria-hidden>{icon(c.status)}</span>
              <span className="text-text-primary">{c.label}</span>
            </div>
            <div className="text-right font-mono text-[11px] text-text-secondary truncate">
              {c.note || '\u00A0'}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={() => void run()}>Run checks</Button>
        {ts && <span className="font-mono text-[11px] text-text-ghost">Last run: {ts}</span>}
      </div>
    </div>
  )
}
