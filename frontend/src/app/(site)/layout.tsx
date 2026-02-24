import Link from 'next/link'
import NavAuth from '@/components/NavAuth'
import CompositorMark from '@/components/CompositorMark'
import MobileNav from '@/components/MobileNav'
import FooterAccordion from '@/components/FooterAccordion'
import CookieConsent from '@/components/CookieConsent'

function Nav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-[#111111] bg-[#FDFCF8]">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="flex h-12 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-display text-[13px] font-bold uppercase tracking-[0.08em] text-[#111111]">
            <CompositorMark size={26} />
            PagePerfect
          </Link>
          {/* Desktop nav */}
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/pricing" className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111] transition-colors duration-75 hover:text-[#FF3333]">Pricing</Link>
            <Link href="/journal" className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111] transition-colors duration-75 hover:text-[#FF3333]">Journal</Link>
            <Link href="/docs" className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111] transition-colors duration-75 hover:text-[#FF3333]">Docs</Link>
            <NavAuth />
            <Link
              href="/app"
              className="bg-[#FF3333] px-5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white transition-all duration-75 hover:bg-[#E52222]"
            >
              Open Editor
            </Link>
          </div>
          {/* Mobile nav */}
          <MobileNav />
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="border-t-2 border-[#111111] bg-[#FDFCF8] py-10 md:py-16">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {/* Desktop: 4-column grid. Mobile: brand + accordions stacked */}
        <div className="md:grid md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-12">
          {/* Brand */}
          <div className="mb-8 md:mb-0">
            <div className="flex items-center gap-2.5">
              <CompositorMark size={26} />
              <span className="font-display text-[13px] font-bold uppercase tracking-[0.08em] text-[#111111]">PagePerfect</span>
            </div>
            <p className="mt-3 max-w-xs font-body text-sm leading-relaxed text-[#555555]">
              Professional typesetting in your browser. Built on LuaLaTeX. Inspired by M&uuml;ller-Brockmann.
            </p>
            {/* Colophon — desktop only, tucked under brand */}
            <div className="mt-6 hidden space-y-1 font-mono text-[10px] text-[#111111]/40 md:block">
              <p>Inter Tight / Source Serif 4 / IBM Plex Mono</p>
              <p>LuaLaTeX + Pandoc</p>
              <p>EST. 2024</p>
            </div>
          </div>

          {/* Link columns — accordion on mobile, static on desktop */}
          <FooterAccordion
            title="Product"
            links={[
              { href: '/app', label: 'Editor' },
              { href: '/pricing', label: 'Pricing' },
              { href: '/journal', label: 'Journal' },
              { href: '/docs', label: 'Documentation' },
            ]}
          />
          <FooterAccordion
            title="Legal"
            links={[
              { href: '/privacy', label: 'Data & Privacy' },
              { href: '/terms', label: 'Operating Agreement' },
              { href: '/cookies', label: 'Tracking & Telemetry' },
              { href: '/philosophy', label: 'Philosophy' },
            ]}
          />
          <FooterAccordion
            title="Resources"
            links={[
              { href: '/status', label: 'System Status' },
              { href: '/site-directory', label: 'Sitemap' },
            ]}
          />
        </div>

        {/* Copyright */}
        <div className="mt-10 border-t border-[#111111] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#111111]/50">
            &copy; {new Date().getFullYear()} PagePerfect — a subsidiary of eazyaccess ltd.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-specimen="" className="flex min-h-dvh flex-1 flex-col bg-[#FDFCF8] text-[#111111]">
      <a href="#main" className="skip-link">Skip to content</a>
      <Nav />
      <div className="flex-1">{children}</div>
      <Footer />
      <CookieConsent />
    </div>
  )
}
