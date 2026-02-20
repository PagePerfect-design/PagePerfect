const STATEMENTS = [
  {
    num: '01',
    headline: 'Your pages have rhythm.',
    body: 'Every line sits on a mathematical baseline grid \u2014 the same technique used by Penguin, Oxford University Press, and every book you\u2019ve admired on a shelf.',
  },
  {
    num: '02',
    headline: 'Your paragraphs breathe.',
    body: 'Our engine analyzes entire paragraphs to find optimal line breaks. Word goes line by line. We see the whole picture.',
  },
  {
    num: '03',
    headline: 'Your book is print-ready.',
    body: 'PDFs that pass KDP\u2019s automated review on the first try. Correct bleed, margins, and trim for 19 standard book sizes.',
  },
]

export function WhyDifferent() {
  return (
    <section className="relative border-t-2 border-[#111111] py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6 md:px-8">

        {/* ── Heading ── */}
        <div className="mb-16 max-w-3xl md:mb-20">
          <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">
            Architecture
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] font-extrabold leading-[0.88] tracking-tighter text-[#111111]">
            Not just formatted.
            <br />
            Typeset.
          </h2>
        </div>

        {/* ── Statement rows ── */}
        <div>
          {STATEMENTS.map((s) => (
            <div key={s.num}>
              <div className="h-px bg-[#111111]/10" />
              <div className="grid grid-cols-1 gap-3 py-10 md:grid-cols-[4rem_1fr] md:items-baseline md:gap-8 md:py-14">
                {/* Number */}
                <span className="font-display text-[2.5rem] font-extrabold leading-none tracking-tighter text-[#111111]/[0.06] md:text-[3.5rem]">
                  {s.num}
                </span>

                <div>
                  <h3 className="font-display text-xl font-bold leading-[1.05] tracking-tight text-[#111111] md:text-2xl lg:text-[2rem]">
                    {s.headline}
                  </h3>
                  <p className="mt-3 max-w-xl font-body text-[13px] leading-[1.7] text-[#111111]/45">
                    {s.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div className="h-px bg-[#111111]/10" />
        </div>
      </div>
    </section>
  )
}
