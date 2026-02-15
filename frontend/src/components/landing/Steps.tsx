import { Reveal } from './Reveal'

const STEPS = [
  {
    num: '01',
    title: 'Paste your manuscript',
    desc: 'Drop in Markdown, paste from Word, or upload a .docx file. We auto-clean smart quotes, dashes, and formatting artifacts.',
  },
  {
    num: '02',
    title: 'Choose a template',
    desc: 'Eight professional designs. Each is a complete typographic system — calculated baselines, golden-ratio heading scales, and optimized margins. Not a theme. A system.',
  },
  {
    num: '03',
    title: 'Download your book',
    desc: 'Print-ready PDF in seconds. Compatible with Amazon KDP, IngramSpark, Lulu, and every print-on-demand service.',
  },
]

export function HowItWorks() {
  return (
    <section className="py-32 md:py-44 bg-surface-raised">
      <div className="mx-auto max-w-5xl px-6 md:px-8">
        <Reveal>
          <div className="mb-20 text-center md:mb-28">
            <h2 className="font-display text-display-lg font-bold tracking-[-0.03em] text-text-primary">
              Three steps. That&apos;s it.
            </h2>
          </div>
        </Reveal>

        <div>
          {STEPS.map((step, i) => (
            <Reveal key={step.num} delay={i * 0.1}>
              <div className="group border-t border-white/[0.06] py-16 transition-colors duration-300 hover:bg-white/[0.02] md:py-20">
                <div className="flex flex-col gap-6 md:flex-row md:items-baseline md:gap-16 lg:gap-24">
                  {/* Giant number */}
                  <span className="font-display text-step font-bold leading-none text-white/[0.08] transition-colors duration-300 group-hover:text-accent/40">
                    {step.num}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-display text-2xl font-bold text-text-primary md:text-3xl lg:text-4xl">
                      {step.title}
                    </h3>
                    <p className="mt-4 max-w-xl text-lg leading-relaxed text-text-secondary">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
          {/* Final border */}
          <div className="border-t border-white/[0.06]" />
        </div>
      </div>
    </section>
  )
}
