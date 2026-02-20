const STEPS = [
  {
    num: '01',
    title: 'Paste your manuscript',
    body: 'Drop in Markdown or paste from Word. YAML frontmatter sets title, author, and metadata. Smart quotes, em-dashes, and encoding artifacts are cleaned automatically.',
    detail: 'Real-time preview updates as you type. No export steps, no file converters.',
  },
  {
    num: '02',
    title: 'Pick your design system',
    body: 'Twelve typographic systems — from academic Chicago to experimental Avant-Garde. Each uses M\u00fcller-Brockmann grid principles with calculated baselines and heading scales.',
    detail: 'Not themes — mathematical systems where every line locks to a baseline grid.',
  },
  {
    num: '03',
    title: 'Export print-ready PDF',
    body: 'Professional output with embedded fonts, correct bleed, and proper trim. Upload directly to Amazon KDP, IngramSpark, Lulu, or any print-on-demand service.',
    detail: 'Compiles via XeLaTeX. Download, upload to your distributor — done.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative border-t-2 border-[#111111] bg-[#FDFCF8] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-8">

        {/* ── Header ── */}
        <div className="mb-12 max-w-2xl md:mb-16">
          <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/30">
            Process
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] font-extrabold leading-[0.88] tracking-tighter text-[#111111]">
            Three steps.
            <br />
            That&apos;s it.
          </h2>
          <p className="mt-5 font-body text-sm leading-[1.7] text-[#111111]/45">
            From raw manuscript to print-ready PDF.
          </p>
        </div>

        {/* ── Steps ── */}
        <div>
          {STEPS.map((step) => (
            <div key={step.num}>
              <div className="h-px bg-[#111111]/10" />
              <div className="grid grid-cols-1 gap-4 py-10 md:grid-cols-[5rem_1fr_1fr] md:items-baseline md:gap-10 md:py-14">
                {/* Step number */}
                <span className="font-display text-[3rem] font-extrabold leading-none tracking-tighter text-[#111111]/[0.06] md:text-[4rem]">
                  {step.num}
                </span>

                {/* Title + body */}
                <div>
                  <h3 className="font-display text-lg font-bold leading-[1.1] tracking-tight text-[#111111] md:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 font-body text-[13px] leading-[1.7] text-[#111111]/45">
                    {step.body}
                  </p>
                </div>

                {/* Detail aside */}
                <p className="border-l border-[#111111]/10 pl-5 font-body text-[12px] italic leading-[1.7] text-[#111111]/35">
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
          <div className="h-px bg-[#111111]/10" />
        </div>
      </div>
    </section>
  )
}
