import Link from 'next/link'
import Image from 'next/image'

export function Hero() {
  return (
    <section className="relative border-b border-[#111111] bg-[#FDFCF8]">
      <div className="mx-auto max-w-7xl px-6 md:px-8">

        {/* ── Main hero area ── */}
        <div className="grid grid-cols-1 gap-0 md:grid-cols-[1fr_1px_1fr] md:items-end">

          {/* Left: headline + CTA */}
          <div className="pb-8 pt-20 md:pb-20 md:pt-32 lg:pt-40">
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
                className="inline-flex h-12 items-center bg-[#FF3333] px-10 font-mono text-[11px] uppercase tracking-[0.12em] text-white transition-all duration-75 hover:bg-[#E52222]"
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

          {/* Right: hero image — book emerging from laptop */}
          <div className="pb-16 md:pb-20 md:pl-12 md:pt-32 lg:pl-16 lg:pt-40">

            {/* Figure plate — editorial framing */}
            <div className="border-t-2 border-[#111111]">
              <div className="flex items-baseline justify-between pb-4 pt-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">
                  Plate 01
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">
                  Digital &rarr; Print
                </span>
              </div>

              {/* Image — monochrome via CSS filters */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src="/images/hero-book-laptop.webp"
                  alt="A laptop transforming into an open book — digital meets print"
                  fill
                  priority
                  className="object-cover grayscale sepia-[0.12] contrast-[1.05]"
                />
                {/* Inset frame edge */}
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[#111111]/10" />
              </div>

              {/* Figure caption */}
              <div className="flex items-baseline justify-between border-t border-[#111111]/10 pt-3">
                <span className="font-mono text-[8px] text-[#111111]/20">
                  Fig. 01 &mdash; Manuscript to typeset PDF
                </span>
                <span className="font-mono text-[8px] text-[#111111]/20">
                  XeLaTeX &middot; Pandoc
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
