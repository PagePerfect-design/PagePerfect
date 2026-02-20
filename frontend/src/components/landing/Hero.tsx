import Link from 'next/link'
import Image from 'next/image'

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[#111111] bg-[#FDFCF8]">

      {/* ── Screenback — mobile: bottom-rising, desktop: right-aligned ── */}

      {/* Mobile: ghost rises from the bottom */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] md:hidden"
        aria-hidden="true"
      >
        <Image
          src="/images/hero-book-laptop.webp"
          alt=""
          fill
          priority
          className="object-cover object-bottom grayscale"
          style={{
            opacity: 0.07,
            mixBlendMode: 'multiply',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 55%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 55%)',
          }}
        />
      </div>

      {/* Desktop: ghost drifts in from the right */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[60%] md:block"
        aria-hidden="true"
      >
        <Image
          src="/images/hero-book-laptop.webp"
          alt=""
          fill
          className="object-cover object-center grayscale"
          style={{
            opacity: 0.09,
            mixBlendMode: 'multiply',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 45%)',
            maskImage: 'linear-gradient(to right, transparent 0%, black 45%)',
          }}
        />
      </div>

      {/* ── Content — sits above the screenback ── */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-8">
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
              className="inline-flex h-12 items-center bg-[#FF3333] px-10 font-mono text-[11px] uppercase tracking-[0.12em] text-white transition-all duration-75 hover:bg-[#E52222]"
            >
              Start Formatting
            </Link>

            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111]/25">
              No account required &middot; Works in any browser
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
