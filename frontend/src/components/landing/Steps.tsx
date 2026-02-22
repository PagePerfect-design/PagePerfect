const STEPS = [
  {
    num: '01',
    title: 'Paste or upload your manuscript',
    body: 'Paste from Word, drop in a .docx, or write in Markdown. Smart quotes, em-dashes, double spaces, and encoding artifacts are cleaned automatically.',
    detail: 'Real-time preview updates as you type. No conversion steps, no file reformatting.',
  },
  {
    num: '02',
    title: 'Pick your trim size and template',
    body: 'Choose from 19 standard book sizes including all KDP formats. Pick a template that matches your genre \u2014 fiction, nonfiction, academic, cookbook, poetry.',
    detail: 'Preview updates instantly. Change template or size any time before export.',
  },
  {
    num: '03',
    title: 'Download and upload to KDP',
    body: 'Get a print-ready PDF with embedded fonts, correct bleed, margins, and trim. Upload directly to Amazon KDP, IngramSpark, or Lulu \u2014 passes automated review on the first try.',
    detail: 'Download, upload to your distributor, approve the proof \u2014 done.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t-2 border-[#111111] bg-[#FDFCF8] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-8">

        {/* ── Header ── */}
        <div className="mb-12 max-w-2xl md:mb-16">
          <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]">
            Process
          </p>
          <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] font-extrabold leading-[0.88] tracking-tighter text-[#111111]">
            Three steps.
            <br />
            That&apos;s it.
          </h2>
          <p className="mt-5 font-body text-sm leading-[1.7] text-[#111111]">
            From messy Word document to KDP-ready PDF.
          </p>
        </div>

        {/* ── Steps ── */}
        <div>
          {STEPS.map((step) => (
            <div key={step.num}>
              <div className="h-px bg-[#111111]" />
              <div className="grid grid-cols-1 gap-4 py-10 md:grid-cols-[5rem_1fr_1fr] md:items-baseline md:gap-10 md:py-14">
                {/* Step number */}
                <span className="font-display text-[3rem] font-extrabold leading-none tracking-tighter text-[#FF3333] md:text-[4rem]">
                  {step.num}
                </span>

                {/* Title + body */}
                <div>
                  <h3 className="font-display text-lg font-bold leading-[1.1] tracking-tight text-[#111111] md:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 font-body text-[13px] leading-[1.7] text-[#333333]">
                    {step.body}
                  </p>
                </div>

                {/* Detail aside */}
                <p className="border-l border-[#111111] pl-5 font-body text-[12px] italic leading-[1.7] text-[#333333]">
                  {step.detail}
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
