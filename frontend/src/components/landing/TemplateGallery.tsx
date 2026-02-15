import Link from 'next/link'
import { Reveal } from './Reveal'

const TEMPLATES = [
  { key: 'symphony', name: 'Symphony', desc: 'Dissertations & scholarly papers', tag: 'Academic', gradient: 'from-blue-500/20 to-indigo-500/20' },
  { key: 'chronicle', name: 'Chronicle', desc: 'Reports & white papers', tag: 'Editorial', gradient: 'from-emerald-500/20 to-teal-500/20' },
  { key: 'exhibit', name: 'Exhibit', desc: 'Trade books & nonfiction', tag: 'Trade', gradient: 'from-amber-500/20 to-orange-500/20' },
  { key: 'matrix', name: 'Matrix', desc: 'Corporate & business docs', tag: 'Business', gradient: 'from-violet-500/20 to-purple-500/20' },
  { key: 'avantgarde', name: 'Avant-Garde', desc: 'Creative & experimental', tag: 'Creative', gradient: 'from-rose-500/20 to-pink-500/20' },
  { key: 'paperback', name: 'Paperback', desc: 'Fiction & general audience', tag: 'Fiction', gradient: 'from-cyan-500/20 to-sky-500/20' },
  { key: 'chicago', name: 'Chicago', desc: 'Classic academic format', tag: 'Academic', gradient: 'from-slate-400/20 to-zinc-500/20' },
  { key: 'minimal', name: 'Minimal', desc: 'Clean & lightweight', tag: 'Basic', gradient: 'from-gray-400/20 to-stone-500/20' },
]

export function TemplateGallery() {
  return (
    <section className="py-32 md:py-44">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <Reveal>
          <div className="mb-16 text-center md:mb-20">
            <h2 className="font-display text-display-lg font-bold tracking-[-0.03em] text-text-primary">
              Eight ways to look published.
            </h2>
            <p className="mt-4 text-xl text-text-secondary max-w-2xl mx-auto">
              Every template is a complete typographic system.
              Pick one. Your text does the rest.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEMPLATES.map((t) => (
              <Link
                key={t.key}
                href={`/app?template=${t.key}`}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-raised transition-all duration-300 hover:-translate-y-2 hover:border-accent/20 hover:shadow-glow-accent"
              >
                {/* Colored header strip */}
                <div className={`h-20 bg-gradient-to-br ${t.gradient}`} />
                <div className="p-5">
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-text-ghost">
                    {t.tag}
                  </div>
                  <h3 className="font-display text-lg font-bold text-text-primary transition-colors group-hover:text-accent">
                    {t.name}
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">{t.desc}</p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-accent opacity-0 transition-opacity group-hover:opacity-100">
                    <span>Try it</span>
                    <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
