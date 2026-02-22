import Link from 'next/link'
import CompositorMark from '@/components/CompositorMark'

export default function NotFound() {
  return (
    <div data-specimen="" className="flex min-h-dvh flex-col bg-[#FDFCF8] text-[#111111]">
      {/* Nav */}
      <nav className="border-b border-[#111111] bg-[#FDFCF8]">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <div className="flex h-12 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 font-display text-[13px] font-bold uppercase tracking-[0.08em] text-[#111111]">
              <CompositorMark size={26} />
              PagePerfect
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/pricing" className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111] transition-colors duration-75 hover:text-[#FF3333] md:inline">Pricing</Link>
              <Link href="/journal" className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-[#111111] transition-colors duration-75 hover:text-[#FF3333] md:inline">Journal</Link>
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

      {/* 404 Content */}
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#111111]/50">
            Error 404
          </p>

          <h1 className="mt-4 font-display text-[clamp(3rem,8vw,6rem)] font-800 uppercase leading-[0.9] tracking-[-0.02em] text-[#111111]">
            Page<br />Not Set
          </h1>

          <div className="mx-auto mt-8 h-[2px] w-16 bg-[#FF3333]" />

          <p className="mx-auto mt-8 max-w-md font-body text-[1.125rem] leading-[1.8] text-[#333333]">
            The page you requested does not exist in the current signature. It may have been removed, renamed, or never imposed in the first place.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/app"
              className="inline-block border border-[#FF3333] bg-[#FF3333] px-8 py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-white transition-all duration-75 hover:bg-[#E52222]"
            >
              Open Editor
            </Link>
            <Link
              href="/"
              className="inline-block border border-[#111111]/20 bg-transparent px-8 py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-[#111111] transition-all duration-75 hover:border-[#111111] hover:bg-[#111111] hover:text-white"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[#111111] bg-[#FDFCF8] py-8">
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#111111]/50">
            &copy; {new Date().getFullYear()} PagePerfect — Typography is the foundation of graphic design.
          </p>
        </div>
      </footer>
    </div>
  )
}
