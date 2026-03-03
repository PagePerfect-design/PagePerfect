import StatusClient from './StatusClient'

export const metadata = {
  title: 'System Status — PagePerfect',
  description: 'Connectivity and capability checks for the compiler backend.',
}

export default function StatusPage() {
  const apiBase = process.env.API_BASE_URL || 'http://localhost:4000'
  return (
    <main id="main">
      {/* Header */}
      <section className="border-b-2 border-[#111111] py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <p className="mb-3 font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50">
            Diagnostics
          </p>
          <h1
            className="max-w-3xl font-display font-extrabold tracking-tighter text-[#111111]"
            style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 3rem)',
              lineHeight: 1.05,
            }}
          >
            System Status
          </h1>
          <p className="mt-4 max-w-xl font-body text-base leading-relaxed text-[#4a4a4a]">
            Verifies that the proxy is healthy and shows enabled options from the compiler service.
          </p>
        </div>
      </section>

      {/* Status content */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <StatusClient apiBase={apiBase} />
        </div>
      </section>
    </main>
  )
}
