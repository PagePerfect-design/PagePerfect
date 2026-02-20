import Link from 'next/link'

export function FinalCTA() {
  return (
    <section className="relative border-t-2 border-[#111111] bg-[#FDFCF8] py-28 text-center md:py-40">
      <div className="mx-auto max-w-3xl px-6 md:px-8">

        {/* Decorative rule */}
        <div className="mx-auto mb-16 h-[2px] w-16 bg-[#FF3333]" />

        <p className="mb-5 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">
          Try it now
        </p>

        <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] font-extrabold leading-[0.88] tracking-tighter text-[#111111]">
          Your manuscript
          <br />
          has been waiting
          <br />
          for this.
        </h2>

        <p className="mx-auto mt-6 max-w-md font-body text-sm leading-[1.7] text-[#111111]/40">
          Open the editor. Paste your text. See what professional
          typesetting actually looks like.
        </p>

        <div className="mt-12 flex flex-col items-center gap-5">
          <Link
            href="/app"
            className="inline-flex h-12 items-center bg-[#FF3333] px-12 font-mono text-[11px] uppercase tracking-[0.12em] text-white transition-all duration-75 hover:bg-[#E52222]"
          >
            Open the Editor
          </Link>

          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#111111]/20">
            No account required &middot; Free forever
          </p>
        </div>
      </div>
    </section>
  )
}
