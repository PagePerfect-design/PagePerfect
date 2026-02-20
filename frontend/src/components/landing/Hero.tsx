import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative border-b border-[#111111] bg-[#FDFCF8]">
      <div className="mx-auto max-w-7xl px-6 md:px-8">

        {/* ── Main hero area ── */}
        <div className="grid grid-cols-1 gap-0 md:grid-cols-[1fr_1px_auto] md:items-end">

          {/* Left: headline + CTA */}
          <div className="pb-16 pt-20 md:pb-20 md:pt-32 lg:pt-40">
            <h1 className="font-display text-[clamp(3rem,8vw,7rem)] font-extrabold leading-[0.85] tracking-tighter text-[#111111]">
              Paste text.
              <br />
              Get a book.
            </h1>

            <p className="mt-8 max-w-md font-body text-sm leading-[1.7] text-[#111111]/50 md:text-base md:leading-[1.7]">
              Stop fighting Word. PagePerfect turns your raw manuscript
              into precision typography and print-ready PDFs &mdash; powered
              by XeLaTeX with baseline grids and golden-ratio type scales.
            </p>

            <div className="mt-10 flex flex-col items-start gap-6">
              <Link
                href="/app"
                className="inline-flex h-12 items-center border border-[#111111] bg-[#111111] px-10 font-mono text-[11px] uppercase tracking-[0.12em] text-white transition-all duration-75 hover:bg-transparent hover:text-[#111111]"
              >
                Start Formatting
              </Link>

              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111]/25">
                No account required &middot; Works in any browser
              </p>
            </div>
          </div>

          {/* Vertical rule */}
          <div className="hidden bg-[#111111]/15 md:block" />

          {/* Right: specimen type sample */}
          <div className="hidden border-t border-[#111111]/15 pb-20 pt-10 md:block md:border-t-0 md:pb-20 md:pl-12 md:pt-32 lg:pl-16 lg:pt-40">
            <div className="w-64 lg:w-72">
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">
                Specimen &mdash; EB Garamond
              </p>
              <div className="mt-4 border-t-2 border-[#111111] pt-4">
                <p className="font-body text-[28px] leading-[1.25] tracking-tight text-[#111111]/80 lg:text-[32px]">
                  The morning light filtered through the old windows of the library
                </p>
                <div className="mt-4 flex items-baseline justify-between border-t border-[#111111]/10 pt-3">
                  <span className="font-mono text-[9px] text-[#111111]/30">12pt / 18pt leading</span>
                  <span className="font-mono text-[9px] text-[#111111]/30">Scale 2.25&times;</span>
                </div>
              </div>

              <div className="mt-6 border-t border-[#111111]/10 pt-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">
                  Baseline Grid
                </p>
                <div className="mt-2 space-y-[12px]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-px bg-[#111111]/8" />
                  ))}
                </div>
                <p className="mt-2 font-mono text-[8px] text-[#111111]/20">
                  12pt intervals &middot; M&uuml;ller-Brockmann grid
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
