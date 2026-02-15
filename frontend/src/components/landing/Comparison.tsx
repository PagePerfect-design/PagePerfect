import { Reveal } from './Reveal'

function WordDoc() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#fafafa] p-0 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)]">
      {/* Fake window chrome */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-[#f0f0f0] px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-[10px] text-gray-400">manuscript-final-FINAL-v3.docx</span>
      </div>
      {/* Bad Word formatting */}
      <div className="space-y-3 p-6 md:p-8">
        <div className="font-sans text-[15px] font-bold uppercase text-gray-800 md:text-lg">CHAPTER ONE</div>
        <div className="font-serif text-[12px] leading-[1.4] text-gray-700 md:text-[13px]">
          <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>The morning light filtered through the old windows of the library, casting long shadows across the worn wooden desk where she&apos;d spent every morning for the past three years.&nbsp;&nbsp;The coffee had gone cold again.
        </div>
        <div className="font-serif text-[12px] leading-[1.4] text-gray-700 md:text-[13px]">
          <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>She picked up the manuscript — three hundred pages of her life&apos;s work, still unfinished,&nbsp;still demanding&nbsp;more. The margins were wrong.&nbsp;&nbsp;The font was wrong. Everything about this document screamed &ldquo;amateur.&rdquo;
        </div>
        <div className="mt-2 font-serif text-[12px] leading-[1.4] text-gray-700 md:text-[13px]">
          <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>But today would be different.&nbsp;&nbsp;Today she&apos;d found something that could change everything — a tool that understood what a real book should look like.
        </div>
      </div>
    </div>
  )
}

function TypesetPage() {
  const lines = [72, 68, 75, 62, 70, 65, 73, 58, 71, 66, 74, 60, 69, 64]
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5),0_0_60px_-20px_rgba(79,143,255,0.15)]">
      {/* Inner page with proper margins */}
      <div className="px-[16%] py-[14%]">
        {/* Chapter heading — centered, elegant */}
        <div className="mb-[10%] text-center">
          <div className="mb-3 font-mono text-[7px] uppercase tracking-[0.4em] text-gray-300">Chapter One</div>
          <div className="mx-auto h-px w-10 bg-gray-200" />
        </div>
        {/* Drop cap + body lines simulating real typesetting */}
        <div className="flex gap-[6px]">
          <span className="font-serif text-[28px] font-light leading-[0.85] text-gray-600 md:text-[36px]">T</span>
          <div className="flex-1 space-y-[4px] pt-[3px]">
            {lines.map((w, i) => (
              <div
                key={i}
                className="h-[2px] rounded-full bg-gray-200/80"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>
        {/* Page number */}
        <div className="mt-[10%] text-center font-mono text-[6px] tracking-widest text-gray-200">1</div>
      </div>
    </div>
  )
}

export function Comparison() {
  return (
    <section className="relative py-32 md:py-44">
      {/* Background glow behind comparison */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(79,143,255,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 md:px-8">
        <Reveal>
          <div className="mb-16 text-center md:mb-24">
            <h2 className="font-display text-display-lg font-bold tracking-[-0.03em] text-white">
              The difference is visible.
            </h2>
            <p className="mt-5 text-xl text-white/40">
              Same words. One is formatted. One is <em className="text-white/60 not-italic">typeset</em>.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-12">
            {/* Before */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/25">Before</span>
              </div>
              <WordDoc />
            </div>
            {/* Arrow divider on desktop */}
            {/* After */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-accent/60">After</span>
                <div className="h-px flex-1 bg-gradient-to-r from-accent/20 to-transparent" />
              </div>
              <TypesetPage />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
