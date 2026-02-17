import Link from 'next/link'
import Image from 'next/image'
import NavAuth from '@/components/NavAuth'

function Nav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#050505]/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-70">
            <Image src="/PagePerfect_1_Icon.png" alt="PagePerfect" width={24} height={24} className="h-6 w-6" priority />
            <span className="font-display text-[15px] font-bold tracking-tight text-white">PagePerfect</span>
          </Link>
          <div className="flex items-center gap-8">
            <Link href="/pricing" className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/40 transition-colors hover:text-white">Pricing</Link>
            <Link href="/docs" className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/40 transition-colors hover:text-white">Docs</Link>
            <NavAuth />
            <Link href="/app" className="border border-white/[0.15] px-5 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-white transition-colors hover:border-white/30 hover:bg-white/[0.04]">
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
    <footer className="border-t border-white/[0.06] bg-[#050505] py-16">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_auto_auto_auto] md:gap-20">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <Image src="/PagePerfect_1_Icon.png" alt="PagePerfect" width={18} height={18} className="h-[18px] w-[18px] opacity-50" />
              <span className="font-display text-sm font-semibold tracking-tight text-white/40">PagePerfect</span>
            </div>
            <p className="mt-4 max-w-xs font-body text-sm leading-relaxed text-white/20">
              Professional typesetting in your browser. Built on XeLaTeX. Inspired by Muller-Brockmann.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-white/25">Product</p>
            <div className="flex flex-col gap-2.5">
              <Link href="/app" className="font-body text-sm text-white/30 transition-colors hover:text-white">Editor</Link>
              <Link href="/pricing" className="font-body text-sm text-white/30 transition-colors hover:text-white">Pricing</Link>
              <Link href="/docs" className="font-body text-sm text-white/30 transition-colors hover:text-white">Documentation</Link>
            </div>
          </div>

          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-white/25">System</p>
            <div className="flex flex-col gap-2.5">
              <Link href="/status" className="font-body text-sm text-white/30 transition-colors hover:text-white">Status</Link>
            </div>
          </div>

          {/* Colophon */}
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-white/25">Colophon</p>
            <div className="space-y-1.5 font-mono text-[10px] text-white/20">
              <p>Inter Tight / Source Serif 4</p>
              <p>IBM Plex Mono</p>
              <p>XeLaTeX + Pandoc</p>
              <p>EST. 2024</p>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/[0.04] pt-6">
          <p className="font-mono text-[10px] text-white/10">
            &copy; {new Date().getFullYear()} PagePerfect. Typography is the foundation of graphic design.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Nav />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  )
}
