import { Reveal } from './Reveal'

const STATEMENTS = [
  {
    headline: 'Your pages have rhythm.',
    body: 'Every line sits on a mathematical baseline grid. The same technique used by Penguin, Oxford University Press, and every book you\u2019ve admired on a shelf.',
  },
  {
    headline: 'Your paragraphs breathe.',
    body: 'Our engine analyzes entire paragraphs to find optimal line breaks. Word goes line by line. We see the whole picture.',
  },
  {
    headline: 'Your book is print-ready.',
    body: 'PDFs that pass KDP\u2019s automated review on the first try. Correct bleed, margins, and trim for 11 standard book sizes.',
  },
]

export function WhyDifferent() {
  return (
    <section className="py-32 md:py-44 bg-surface-raised">
      <div className="mx-auto max-w-5xl px-6 md:px-8">
        <Reveal>
          <div className="mb-20 text-center md:mb-28">
            <h2 className="font-display text-display-lg font-bold tracking-[-0.03em] text-text-primary">
              Not just formatted.{' '}
              <span className="bg-gradient-to-r from-accent to-violet-400 bg-clip-text text-transparent">
                Typeset.
              </span>
            </h2>
          </div>
        </Reveal>

        <div className="space-y-20 md:space-y-28">
          {STATEMENTS.map((s, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="max-w-3xl">
                <h3 className="font-display text-3xl font-bold text-text-primary md:text-4xl lg:text-5xl">
                  {s.headline}
                </h3>
                <p className="mt-6 text-lg leading-relaxed text-text-secondary md:text-xl">
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
