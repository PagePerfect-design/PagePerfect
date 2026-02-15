import { Reveal } from './Reveal'

function WordDoc() {
  return (
    <div className="rounded-xl border border-white/10 bg-white p-6 shadow-paper">
      <div className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <span className="ml-2 font-mono text-[9px] text-gray-400">manuscript.docx</span>
      </div>
      {/* Ugly Word-style formatting */}
      <div className="space-y-2 font-serif text-[10px] leading-relaxed text-gray-800 md:text-xs">
        <div className="text-base font-bold md:text-lg">CHAPTER ONE</div>
        <div className="leading-tight">
          The morning light filtered through the old windows of the library, casting long shadows across the worn wooden desk where she&apos;d spent every morning for the past three years.&nbsp;&nbsp;The coffee had gone cold again.
        </div>
        <div className="leading-tight">
          She picked up the manuscript — three hundred pages of her life&apos;s work,
          still unfinished,&nbsp;still demanding&nbsp;more of her than she had to give.
          The margins were wrong.&nbsp;&nbsp;The font was wrong. Everything about this
          document screamed &ldquo;amateur.&rdquo;
        </div>
      </div>
    </div>
  )
}

function TypesetPage() {
  const lines = [72, 68, 75, 62, 70, 65, 73, 58, 71, 66, 74, 60]
  return (
    <div className="rounded-xl border border-white/10 bg-white shadow-paper">
      <div className="px-[14%] py-[12%]">
        {/* Chapter number */}
        <div className="mb-[6%] text-center">
          <div className="font-mono text-[8px] uppercase tracking-[0.3em] text-gray-400">Chapter One</div>
          <div className="mx-auto mt-2 h-px w-12 bg-gray-300" />
        </div>
        {/* Drop cap + body lines */}
        <div className="flex gap-1">
          <span className="font-serif text-3xl font-light leading-none text-gray-700">T</span>
          <div className="flex-1 space-y-[5px] pt-0.5">
            {lines.map((w, i) => (
              <div
                key={i}
                className="h-[2px] rounded-full bg-gray-200"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>
        {/* Page number */}
        <div className="mt-[8%] text-center font-mono text-[7px] text-gray-300">1</div>
      </div>
    </div>
  )
}

export function Comparison() {
  return (
    <section className="py-32 md:py-44">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <Reveal>
          <div className="mb-16 text-center md:mb-20">
            <h2 className="font-display text-display-lg font-bold tracking-[-0.03em] text-text-primary">
              The difference is visible.
            </h2>
            <p className="mt-4 text-xl text-text-secondary">
              Same text. One is formatted. One is typeset.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
            {/* Before */}
            <div>
              <div className="mb-4 font-mono text-xs uppercase tracking-widest text-text-ghost">
                Your Word doc
              </div>
              <WordDoc />
            </div>
            {/* After */}
            <div>
              <div className="mb-4 text-right font-mono text-xs uppercase tracking-widest text-accent">
                PagePerfect PDF
              </div>
              <TypesetPage />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
