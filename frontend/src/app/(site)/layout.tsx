import Link from 'next/link'
import NavAuth from '@/components/NavAuth'
import CompositorMark from '@/components/CompositorMark'

function Nav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-[#111111] bg-[#FDFCF8]">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="flex h-12 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-display text-[13px] font-bold uppercase tracking-[0.08em] text-[#111111]">
            <CompositorMark size={26} />
            PagePerfect
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111] transition-colors duration-75 hover:text-[#FF3333]">Pricing</Link>
            <Link href="/journal" className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111] transition-colors duration-75 hover:text-[#FF3333]">Journal</Link>
            <NavAuth />
            <Link
              href="/app"
              className="border border-[#111111] bg-[#111111] px-5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white transition-all duration-75 hover:bg-transparent hover:text-[#111111]"
            >
              Open Editor
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="border-t-2 border-[#111111] bg-[#FDFCF8] py-16">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_auto_auto_auto] md:gap-20">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <CompositorMark size={26} />
              <span className="font-display text-[13px] font-bold uppercase tracking-[0.08em] text-[#111111]">PagePerfect</span>
            </div>
            <p className="mt-4 max-w-xs font-body text-sm leading-relaxed text-[#111111]/40">
              Professional typesetting in your browser. Built on XeLaTeX. Inspired by M&uuml;ller-Brockmann.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">Product</p>
            <div className="flex flex-col gap-2.5">
              <Link href="/app" className="font-mono text-[11px] text-[#111111]/50 transition-colors duration-75 hover:text-[#111111]">Editor</Link>
              <Link href="/pricing" className="font-mono text-[11px] text-[#111111]/50 transition-colors duration-75 hover:text-[#111111]">Pricing</Link>
              <Link href="/journal" className="font-mono text-[11px] text-[#111111]/50 transition-colors duration-75 hover:text-[#111111]">Journal</Link>
              <Link href="/docs" className="font-mono text-[11px] text-[#111111]/50 transition-colors duration-75 hover:text-[#111111]">Documentation</Link>
            </div>
          </div>

          <div>
            <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">System</p>
            <div className="flex flex-col gap-2.5">
              <Link href="/status" className="font-mono text-[11px] text-[#111111]/50 transition-colors duration-75 hover:text-[#111111]">Status</Link>
            </div>
          </div>

          {/* Colophon */}
          <div>
            <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">Colophon</p>
            <div className="space-y-1.5 font-mono text-[10px] text-[#111111]/30">
              <p>Inter Tight / Source Serif 4</p>
              <p>IBM Plex Mono</p>
              <p>XeLaTeX + Pandoc</p>
              <p>EST. 2024</p>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-[#111111]/10 pt-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#111111]/20">
            &copy; {new Date().getFullYear()} PagePerfect. Typography is the foundation of graphic design.
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
    </div>
  )
}
