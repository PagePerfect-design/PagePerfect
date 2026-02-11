import StatusClient from './StatusClient'

export const metadata = {
  title: 'System Status — Page Perfect',
  description: 'Connectivity and capability checks for the compiler backend.',
}

export default function StatusPage() {
  // Next rewrites send /api/* to this base; show it for ops clarity
  const apiBase = process.env.RAILWAY_API_BASE || 'http://localhost:4000'
  return (
    <main id="main" className="min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-h2 font-bold tracking-tight text-text-primary mb-3">System Status</h1>
          <p className="text-text-secondary mb-6">
            Verifies that the proxy is healthy and shows enabled options from the compiler service.
          </p>
          <div>
            <StatusClient apiBase={apiBase} />
          </div>
        </div>
      </div>
    </main>
  )
}
