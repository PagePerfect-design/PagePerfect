'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const TEMPLATES = [
  { key: 'symphony', name: 'Symphony', desc: 'Dissertations & scholarly papers', tag: 'Academic', gradient: 'from-blue-500/30 to-indigo-500/20' },
  { key: 'chronicle', name: 'Chronicle', desc: 'Reports & white papers', tag: 'Editorial', gradient: 'from-emerald-500/30 to-teal-500/20' },
  { key: 'exhibit', name: 'Exhibit', desc: 'Trade books & nonfiction', tag: 'Trade', gradient: 'from-amber-500/30 to-orange-500/20' },
  { key: 'matrix', name: 'Matrix', desc: 'Corporate & business docs', tag: 'Business', gradient: 'from-violet-500/30 to-purple-500/20' },
  { key: 'avantgarde', name: 'Avant-Garde', desc: 'Creative & experimental', tag: 'Creative', gradient: 'from-rose-500/30 to-pink-500/20' },
  { key: 'paperback', name: 'Paperback', desc: 'Fiction & general audience', tag: 'Fiction', gradient: 'from-cyan-500/30 to-sky-500/20' },
  { key: 'chicago', name: 'Chicago', desc: 'Classic academic format', tag: 'Academic', gradient: 'from-slate-400/30 to-zinc-500/20' },
  { key: 'minimal', name: 'Minimal', desc: 'Clean & lightweight', tag: 'Basic', gradient: 'from-gray-400/30 to-stone-500/20' },
]

function MiniPage() {
  const lines = [65, 72, 58, 70, 63, 75, 55]
  return (
    <div className="mx-auto w-[60%] aspect-[3/4] rounded bg-white/90 p-[12%] shadow-sm">
      <div className="mb-[10%]">
        <div className="h-[3px] w-[50%] rounded-full bg-gray-700/60" />
        <div className="mt-[6%] h-[2px] w-[30%] rounded-full bg-gray-300" />
      </div>
      <div className="space-y-[5%]">
        {lines.map((w, i) => (
          <div key={i} className="h-[1.5px] rounded-full bg-gray-200" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  )
}

export function TemplateGallery() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="section-separator relative overflow-hidden bg-surface-raised py-32 md:py-44">
      {/* Background image — bookshelf, heavily darkened */}
      <div className="absolute inset-0">
        <Image
          src="/images/bookshelf-panorama.webp"
          alt=""
          fill
          className="object-cover opacity-[0.05]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-surface-raised/90" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-dot-grid-subtle" />

      <div className="relative mx-auto max-w-6xl px-6 md:px-8">
        <div className="mb-16 text-center md:mb-20">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-accent/50">Templates</div>
          <h2 className="font-display text-display-lg font-bold tracking-tighter text-white">
            Eight ways to look{' '}
            <span className="gradient-accent-text">published</span>.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-xl text-white/35">
            Every template is a complete typographic system.
            Pick one. Your text does the rest.
          </p>
        </div>

        <div ref={ref} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {TEMPLATES.map((t, i) => (
            <motion.div
              key={t.key}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.06, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <Link
                href={`/app?template=${t.key}`}
                className="group relative block overflow-hidden rounded-2xl border border-white/[0.06] bg-surface/80 backdrop-blur-sm transition-all duration-400 hover:-translate-y-2 hover:border-white/[0.12] hover:shadow-[0_20px_60px_-20px_rgba(59,130,246,0.2)]"
              >
                <div className={`relative flex items-center justify-center bg-gradient-to-br ${t.gradient} py-8 md:py-10`}>
                  <MiniPage />
                </div>
                <div className="p-4 md:p-5">
                  <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-white/20">
                    {t.tag}
                  </div>
                  <h3 className="font-display text-base font-bold text-white transition-colors group-hover:text-accent md:text-lg">
                    {t.name}
                  </h3>
                  <p className="mt-1 text-[13px] text-white/30">{t.desc}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-accent/0 transition-all duration-300 group-hover:text-accent/70">
                    <span>Try it</span>
                    <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
