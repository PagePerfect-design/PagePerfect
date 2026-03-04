import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sitemap — PagePerfect',
  description:
    'Complete directory of every page, tool, and resource on PagePerfect. Professional typesetting, documentation, journal articles, and account management.',
  openGraph: {
    title: 'Sitemap — PagePerfect',
    description:
      'Complete directory of every page, tool, and resource on PagePerfect.',
    type: 'website',
  },
}

interface SitemapLink {
  href: string
  label: string
  description?: string
}

interface SitemapGroup {
  number: string
  title: string
  links: SitemapLink[]
}

const SITEMAP_GROUPS: SitemapGroup[] = [
  {
    number: '01',
    title: 'Product',
    links: [
      { href: '/', label: 'Home', description: 'Landing page and product overview' },
      { href: '/app', label: 'Editor', description: 'Full-screen Markdown editor with live PDF preview' },
      { href: '/pricing', label: 'Pricing', description: 'Drafter, Publisher, and Studio tiers' },
      { href: '/status', label: 'System Status', description: 'API connectivity and server diagnostics' },
    ],
  },
  {
    number: '02',
    title: 'Knowledge',
    links: [
      { href: '/docs', label: 'Operating the Engine', description: 'Template reference, KDP guide, troubleshooting' },
      { href: '/journal', label: 'Typography & Conversion', description: 'Essays on typesetting, layout, and publishing' },
      { href: '/philosophy', label: 'Philosophy & Colophon', description: 'Design principles and system specifications' },
    ],
  },
  {
    number: '03',
    title: 'Account',
    links: [
      { href: '/auth/login', label: 'Sign In', description: 'Email, Google, or GitHub authentication' },
      { href: '/auth/forgot-password', label: 'Reset Password', description: 'Request a password reset link' },
    ],
  },
  {
    number: '04',
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Data & Privacy', description: 'Session-scoped storage and data handling' },
      { href: '/terms', label: 'Operating Agreement', description: 'Terms of use and service conditions' },
      { href: '/cookies', label: 'Tracking & Telemetry', description: 'Cookie policy and analytics disclosure' },
    ],
  },
]

export default function SitemapPage() {
  return (
    <main id="main">
      {/* Header */}
      <section className="border-b-2 border-[#111111] py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <p className="mb-3 font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50">
            Directory
          </p>
          <h1
            className="max-w-3xl font-display font-extrabold tracking-tighter text-[#111111]"
            style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 3rem)',
              lineHeight: 1.05,
            }}
          >
            Sitemap
          </h1>
          <p className="mt-4 max-w-xl font-body text-base leading-relaxed text-[#4a4a4a]">
            Complete index of every page, tool, and resource available on PagePerfect.
          </p>
        </div>
      </section>

      {/* Sitemap Groups */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <nav aria-label="Sitemap" className="grid grid-cols-1 gap-0 md:grid-cols-2">
            {SITEMAP_GROUPS.map((group, i) => (
              <div
                key={group.number}
                className={`border-b border-[#e5e5e0] py-10 ${
                  i % 2 === 1 ? 'md:border-l md:border-[#e5e5e0] md:pl-10' : 'md:pr-10'
                }`}
              >
                <p className="mb-2 font-mono text-[0.625rem] text-[#111111]/30">
                  {group.number}
                </p>
                <h2 className="font-display text-lg font-bold tracking-tight text-[#111111]">
                  {group.title}
                </h2>
                <ul className="mt-6 space-y-0" role="list">
                  {group.links.map((link) => (
                    <li key={link.href} className="border-t border-[#e5e5e0] first:border-t-0">
                      <Link
                        href={link.href}
                        className="group block py-3 transition-colors duration-200 ease-pp"
                      >
                        <span className="font-display text-[0.9375rem] font-semibold text-[#111111] transition-colors duration-200 ease-pp group-hover:text-[#FF3333]">
                          {link.label}
                        </span>
                        {link.description && (
                          <span className="mt-0.5 block font-body text-[0.8125rem] text-[#4a4a4a]">
                            {link.description}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t-2 border-[#111111] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 text-center md:px-8">
          <p className="mb-4 font-mono text-[0.625rem] uppercase tracking-[0.15em] text-[#111111]/50">
            Start typesetting
          </p>
          <h2
            className="font-display font-extrabold tracking-tighter text-[#111111]"
            style={{ lineHeight: 0.95, fontSize: 'clamp(1.5rem, 2.5vw, 2.5rem)' }}
          >
            Open the Editor
          </h2>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/app"
              className="border border-[#FF3333] bg-[#FF3333] px-8 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white transition-all duration-200 ease-pp hover:bg-[#E52222]"
            >
              Start Formatting
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
