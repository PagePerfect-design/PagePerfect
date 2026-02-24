import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[#111111] bg-[#FDFCF8]">

      {/* ── Content — typography dominates the white space ── */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-8">
        <div className="pb-16 pt-20 md:pb-20 md:pt-32 lg:pt-40">
          <h1 className="font-display text-[clamp(3rem,8vw,7rem)] font-extrabold leading-[0.85] tracking-tighter text-[#111111]">
            Your book.
            <br />
            KDP-ready tonight.
          </h1>

          <p className="mt-8 max-w-md font-body text-sm leading-[1.7] text-[#111111]/50 md:text-base md:leading-[1.7]">
            Paste your manuscript. Pick a trim size. Get a print-compliant PDF
            that passes Amazon KDP and IngramSpark review on the first upload.
            Preview free &mdash; export from $19.99.
          </p>

          <div className="mt-10 flex flex-col items-start gap-4">
            <Link
              href="/app"
              className="inline-flex h-12 items-center bg-[#FF3333] px-10 font-mono text-[11px] uppercase tracking-[0.12em] text-white transition-all duration-75 hover:bg-[#E52222]"
            >
              Start Free &mdash; No Signup
            </Link>

            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#111111]/25">
              Full editor &middot; All 15 templates &middot; Watermarked preview
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
