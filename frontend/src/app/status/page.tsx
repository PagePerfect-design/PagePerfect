import StatusClient from './StatusClient'

export const metadata = {
  title: 'System Status — Page Perfect',
  description: 'Connectivity and capability checks for the compiler backend.',
}

export default function StatusPage() {
  // Next rewrites send /api/* to this base; show it for ops clarity
  const apiBase = process.env.RAILWAY_API_BASE || 'http://localhost:4000'
  return (
    <main id="main" className="min-h-screen bg-white text-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">System Status</h1>
          <p className="text-gray-700 mb-6">
            Verifies that the Vercel → Railway proxy is healthy and shows enabled options from the compiler service.
          </p>
          <div>
            <StatusClient apiBase={apiBase} />
          </div>
        </div>
      </div>
    </main>
  )
}
