import Link from 'next/link'
import { Reveal } from './Reveal'

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-32 text-center md:py-44">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.06] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 md:px-8">
        <Reveal>
          <h2 className="font-display text-display-lg font-bold tracking-[-0.03em] text-text-primary">
            Your manuscript has been
            <br />
            <span className="bg-gradient-to-r from-accent to-violet-400 bg-clip-text text-transparent">
              waiting for this.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-xl leading-relaxed text-text-secondary">
            Open the editor. Paste your text.
            See what professional typesetting actually looks like.
          </p>

          <div className="mt-12">
            <Link
              href="/app"
              className="group inline-flex h-14 items-center gap-3 rounded-full bg-white px-8 text-lg font-semibold text-surface transition-all duration-200 hover:scale-[1.03] hover:shadow-glow-white"
            >
              Open the Editor — Free
              <svg
                className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
