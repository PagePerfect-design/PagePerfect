const STATEMENTS = [
  {
    headline: 'Passes KDP review. First try.',
    body: 'Correct bleed, margins, gutter, and trim for 19 standard book sizes. No rejection emails, no manual fixes, no re-uploading.',
  },
  {
    headline: 'No more orphaned lines.',
    body: 'Our engine analyzes entire paragraphs to find optimal line breaks and eliminates widows and orphans. Word goes line by line. We see the whole page.',
  },
  {
    headline: 'Looks like a real book.',
    body: 'Baseline grids, professional heading scales, proper em-dashes, smart quotes, and drop caps \u2014 the same typographic standards used by Penguin and Oxford University Press.',
  },
]

export function WhyDifferent() {
  return (
    <section className="relative border-t-2 border-[#111111] bg-[#FDFCF8] py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6 md:px-8">

        {/* ── Heading ── */}
        <div className="mb-16 max-w-3xl md:mb-20">
          <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]">
            Why it works
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] font-extrabold leading-[0.88] tracking-tighter text-[#111111]">
            Word can&apos;t do this.
            <br />
            We can.
          </h2>
        </div>

        {/* ── Statement rows ── */}
        <div>
          {STATEMENTS.map((s) => (
            <div key={s.headline}>
              <div className="h-px bg-[#111111]" />
              <div className="py-10 md:py-14">
                <h3 className="font-display text-xl font-bold leading-[1.05] tracking-tight text-[#111111] md:text-2xl lg:text-[2rem]">
                  {s.headline}
                </h3>
                <p className="mt-3 max-w-xl font-body text-[14px] leading-[1.8] text-[#111111]">
                  {s.body}
                </p>
              </div>
            </div>
          ))}
          <div className="h-px bg-[#111111]" />
        </div>
      </div>
    </section>
  )
}
