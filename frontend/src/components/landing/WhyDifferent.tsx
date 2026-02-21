const STATEMENTS = [
  {
    headline: 'Your pages have rhythm.',
    body: 'Every line sits on a mathematical baseline grid \u2014 the same technique used by Penguin, Oxford University Press, and every book you\u2019ve admired on a shelf.',
  },
  {
    headline: 'Your paragraphs breathe.',
    body: 'Our engine analyzes entire paragraphs to find optimal line breaks. Word goes line by line. We see the whole picture.',
  },
  {
    headline: 'Your book is print-ready.',
    body: 'PDFs that pass KDP\u2019s automated review on the first try. Correct bleed, margins, and trim for 19 standard book sizes.',
  },
]

export function WhyDifferent() {
  return (
    <section className="relative border-t-2 border-[#111111] bg-[#FDFCF8] py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6 md:px-8">

        {/* ── Heading ── */}
        <div className="mb-16 max-w-3xl md:mb-20">
          <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]">
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
