import Button from '@/components/Button'
import Link from 'next/link'

const TEMPLATES = [
  { key: 'symphony', name: 'Symphony', desc: 'Scholarly papers & dissertations', tag: 'Academic', accent: 'from-blue-500/20 to-indigo-500/20' },
  { key: 'chronicle', name: 'Chronicle', desc: 'Reports & white papers', tag: 'Editorial', accent: 'from-emerald-500/20 to-teal-500/20' },
  { key: 'exhibit', name: 'Exhibit', desc: 'Trade books & nonfiction', tag: 'Trade', accent: 'from-amber-500/20 to-orange-500/20' },
  { key: 'matrix', name: 'Matrix', desc: 'Corporate & business docs', tag: 'Business', accent: 'from-violet-500/20 to-purple-500/20' },
  { key: 'avantgarde', name: 'Avant-Garde', desc: 'Creative & experimental', tag: 'Creative', accent: 'from-rose-500/20 to-pink-500/20' },
  { key: 'paperback', name: 'Paperback', desc: 'Fiction & general audience', tag: 'Fiction', accent: 'from-cyan-500/20 to-sky-500/20' },
]

const STEPS = [
  {
    num: '01',
    title: 'Paste your text',
    desc: 'Drop in Markdown or paste from Word. We auto-clean formatting artifacts, smart quotes, and messy spacing.',
    visual: 'paste',
  },
  {
    num: '02',
    title: 'Pick a look',
    desc: 'Choose from 8 professional templates. Each is a complete typographic system — not a skin.',
    visual: 'template',
  },
  {
    num: '03',
    title: 'Download your PDF',
    desc: 'Print-ready output in seconds. Works with Amazon KDP, IngramSpark, and every print-on-demand service.',
    visual: 'download',
  },
]

function MockPage() {
  const lines = [70, 50, 65, 40, 75, 55, 60, 45, 70, 35]
  return (
    <div className="relative w-full aspect-[3/4] bg-white rounded-lg shadow-paper overflow-hidden p-[12%]">
      {/* Title block */}
      <div className="mb-[8%]">
        <div className="h-[3%] w-[55%] bg-gray-800 rounded-full mb-[3%]" />
        <div className="h-[1.5%] w-[35%] bg-gray-300 rounded-full" />
      </div>
      {/* Body lines */}
      <div className="space-y-[2.5%]">
        {lines.map((w, i) => (
          <div key={i} className="h-[1.2%] bg-gray-200 rounded-full" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  )
}

function StepVisual({ type }: { type: string }) {
  if (type === 'paste') {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="w-[80%] max-w-[280px] rounded-xl border border-[rgba(255,255,255,0.1)] bg-surface-raised p-5 font-mono text-xs text-text-tertiary leading-relaxed">
          <div className="text-accent mb-2"># Chapter 1</div>
          <div className="text-text-secondary">The morning light filtered</div>
          <div className="text-text-secondary">through the old windows of</div>
          <div className="text-text-secondary">the library, casting long</div>
          <div className="text-text-secondary">shadows across the desk...</div>
          <div className="mt-3 h-px bg-gradient-to-r from-accent/40 to-transparent" />
          <div className="mt-2 text-text-ghost text-[10px]">Paste or type Markdown</div>
        </div>
      </div>
    )
  }
  if (type === 'template') {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="grid grid-cols-3 gap-2 w-[85%] max-w-[300px]">
          {['Symphony', 'Chronicle', 'Exhibit', 'Matrix', 'Avant-Garde', 'Paperback'].map((name, i) => (
            <div
              key={name}
              className={`aspect-[3/4] rounded-lg border ${i === 0 ? 'border-accent/50 shadow-glow-accent bg-accent/5' : 'border-[rgba(255,255,255,0.08)] bg-surface-raised'} p-2 flex flex-col items-start`}
            >
              <div className="h-[2px] w-[60%] bg-text-ghost/50 rounded-full mb-1" />
              <div className="h-[1.5px] w-[80%] bg-text-ghost/30 rounded-full mb-0.5" />
              <div className="h-[1.5px] w-[70%] bg-text-ghost/30 rounded-full mb-0.5" />
              <div className="h-[1.5px] w-[50%] bg-text-ghost/30 rounded-full" />
              <div className="mt-auto text-[8px] text-text-ghost truncate w-full">{name}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  // download
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="relative">
        <div className="w-[140px] aspect-[3/4] bg-white rounded-lg shadow-paper">
          <div className="p-4">
            <div className="h-[3px] w-[60%] bg-gray-800 rounded-full mb-2" />
            <div className="h-[2px] w-[40%] bg-gray-300 rounded-full mb-3" />
            <div className="space-y-1.5">
              {[70, 55, 65, 45, 72, 50, 68, 40, 75, 58].map((w, i) => (
                <div key={i} className="h-[1.5px] bg-gray-200 rounded-full" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        </div>
        <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-success/20 border border-success/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main id="main">
      {/* ===== HERO — Cinematic, emotional, visual ===== */}
      <section className="relative overflow-hidden pt-20 pb-32 md:pt-28 md:pb-40">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[100%] h-[70%] bg-[radial-gradient(ellipse,rgba(79,143,255,0.07)_0%,transparent_60%)]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[radial-gradient(ellipse,rgba(139,92,246,0.05)_0%,transparent_60%)]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 md:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 mb-8 animate-fade-in">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                <span className="font-mono text-xs text-accent">Free to use — no account needed</span>
              </div>

              <h1 className="font-display text-hero font-black leading-[1.05] tracking-tight text-text-primary animate-fade-in-up">
                Paste your words.<br />
                Get a <span className="gradient-accent-text">beautiful book.</span>
              </h1>

              <p className="mt-6 text-lg md:text-xl text-text-secondary max-w-lg leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                PagePerfect turns your text into professionally typeset, print-ready PDFs.
                No design skills. No complicated software. Just paste and publish.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <Button size="lg" href="/app">
                  Start Typesetting — Free
                </Button>
                <Button variant="secondary" size="lg" href="#how-it-works">
                  See How It Works
                </Button>
              </div>

              <p className="mt-6 text-sm text-text-tertiary animate-fade-in" style={{ animationDelay: '0.3s' }}>
                Works in any browser. Nothing to install or configure.
              </p>
            </div>

            {/* Right: Visual — Before/After */}
            <div className="relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative flex items-center justify-center gap-6 md:gap-8">
                {/* "Before" — raw text */}
                <div className="w-[42%] max-w-[200px] relative">
                  <div className="absolute -top-6 left-0 font-mono text-[10px] uppercase tracking-widest text-text-ghost">Your text</div>
                  <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-surface-raised p-4 font-mono text-[9px] md:text-[10px] text-text-tertiary leading-relaxed shadow-card">
                    <span className="text-accent"># My Novel</span><br /><br />
                    <span className="text-text-secondary">The morning light</span><br />
                    <span className="text-text-secondary">filtered through the</span><br />
                    <span className="text-text-secondary">old library windows,</span><br />
                    <span className="text-text-secondary">casting long shadows</span><br />
                    <span className="text-text-secondary">across the worn desk</span><br />
                    <span className="text-text-secondary">where she&apos;d spent</span><br />
                    <span className="text-text-secondary">every morning...</span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-accent/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="font-mono text-[9px] text-text-ghost">PagePerfect</span>
                </div>

                {/* "After" — typeset page */}
                <div className="w-[42%] max-w-[200px] relative">
                  <div className="absolute -top-6 right-0 font-mono text-[10px] uppercase tracking-widest text-accent">Print-ready PDF</div>
                  <MockPage />
                </div>
              </div>

              {/* Floating accent element */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-mono text-[10px] text-text-ghost bg-surface-raised border border-[rgba(255,255,255,0.06)] rounded-full px-4 py-1.5 shadow-card whitespace-nowrap">
                8 templates &middot; 11 page sizes &middot; Instant preview
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ===== HOW IT WORKS — Visual steps ===== */}
      <section id="how-it-works" className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="text-center mb-20">
            <h2 className="font-display text-h2 font-bold tracking-tight text-text-primary">
              Three steps. That&apos;s it.
            </h2>
            <p className="mt-4 text-text-secondary max-w-lg mx-auto">
              No learning curve. No configuration. Paste your text and get a professionally typeset book.
            </p>
          </div>

          <div className="space-y-20 md:space-y-28">
            {STEPS.map((step, i) => (
              <div key={step.num} className={`grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center ${i % 2 === 1 ? 'md:[direction:rtl]' : ''}`}>
                <div className={i % 2 === 1 ? 'md:[direction:ltr]' : ''}>
                  <div className="font-mono text-sm text-accent mb-3">Step {step.num}</div>
                  <h3 className="font-display text-2xl md:text-3xl font-bold text-text-primary mb-4">{step.title}</h3>
                  <p className="text-text-secondary leading-relaxed text-lg">{step.desc}</p>
                </div>
                <div className={`h-[260px] md:h-[300px] rounded-2xl border border-[rgba(255,255,255,0.06)] bg-surface-raised/50 ${i % 2 === 1 ? 'md:[direction:ltr]' : ''}`}>
                  <StepVisual type={step.visual} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ===== WHAT MAKES IT DIFFERENT — Show, don't lecture ===== */}
      <section className="py-24 md:py-32 bg-surface-raised">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-h2 font-bold tracking-tight text-text-primary">
              Not just formatted. <span className="gradient-accent-text">Typeset.</span>
            </h2>
            <p className="mt-4 text-text-secondary max-w-2xl mx-auto leading-relaxed">
              There&apos;s a difference between a Word doc and a real book. PagePerfect uses the same
              professional typesetting engine trusted by academic publishers worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: 'Baseline Grids',
                desc: 'Every line of text aligns to a mathematical grid. Your pages have the same vertical rhythm as professionally published books.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" d="M3 6h18M3 10h18M3 14h18M3 18h18" />
                  </svg>
                ),
              },
              {
                title: 'Golden-Ratio Type Scale',
                desc: 'Heading sizes calculated from a 1.618 multiplier — the same proportional system used in fine Swiss typography.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h6" />
                  </svg>
                ),
              },
              {
                title: 'Optimal Line Breaking',
                desc: 'Paragraphs analyzed as a whole to find the best possible line breaks — not the greedy line-by-line approach of Word.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h14M3 17h10" />
                  </svg>
                ),
              },
              {
                title: 'Microtypography',
                desc: 'Optical margin alignment, character protrusion, and subtle font expansion. The details that separate good from great.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ),
              },
              {
                title: 'Print-Ready Output',
                desc: 'PDFs compatible with Amazon KDP, IngramSpark, and any print-on-demand service. 11 page sizes from pocket to full letter.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                title: 'Paste From Anywhere',
                desc: 'Markdown, Word copy-paste, or plain text. Auto-clean strips smart quotes, fixes dashes, and normalizes formatting.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
              },
            ].map(f => (
              <div key={f.title} className="card p-6 transition-all duration-200 hover:border-[rgba(255,255,255,0.1)] hover:shadow-card-hover hover:-translate-y-0.5 group">
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 group-hover:bg-accent/15 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-display text-lg font-bold text-text-primary mb-2">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ===== TEMPLATES — Visual cards with color accents ===== */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-h2 font-bold tracking-tight text-text-primary">
              Choose your style
            </h2>
            <p className="mt-4 text-text-secondary max-w-lg mx-auto">
              Six professional templates. Each is a complete typographic system with
              calculated baselines, margins, and heading scales.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TEMPLATES.map(t => (
              <Link
                key={t.key}
                href={`/app?template=${t.key}`}
                className="group card p-0 overflow-hidden transition-all duration-200 hover:border-accent/20 hover:shadow-glow-accent hover:-translate-y-1"
              >
                {/* Colored header strip */}
                <div className={`h-24 bg-gradient-to-br ${t.accent} flex items-end p-5`}>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-text-tertiary bg-surface/80 rounded-full px-2.5 py-0.5">{t.tag}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-text-primary group-hover:text-accent transition-colors">{t.name}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{t.desc}</p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Try this template</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ===== VS COMPETITION — Clean, scannable ===== */}
      <section className="py-24 md:py-32 bg-surface-raised">
        <div className="mx-auto max-w-4xl px-6 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-h2 font-bold tracking-tight text-text-primary">
              How we compare
            </h2>
            <p className="mt-4 text-text-secondary max-w-lg mx-auto">Honest comparison. No spin.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                tool: 'Vellum',
                pain: '$500, Mac only',
                detail: '26 preset styles, no baseline grids, no customization beyond color and font choice.',
              },
              {
                tool: 'Atticus',
                pain: '$147, one-time',
                detail: 'Browser-based but laggy on long docs, limited typography, known import corruption issues.',
              },
              {
                tool: 'Reedsy',
                pain: 'Free, limited',
                detail: '3 themes, basic formatting, no real typographic control. Fine for drafts.',
              },
            ].map(c => (
              <div key={c.tool} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <div className="sm:w-28 flex-shrink-0">
                  <span className="font-display font-bold text-text-primary">{c.tool}</span>
                  <div className="text-xs text-text-ghost mt-0.5">{c.pain}</div>
                </div>
                <div className="text-sm text-text-secondary">{c.detail}</div>
              </div>
            ))}

            {/* PagePerfect row — highlighted */}
            <div className="card p-5 border-accent/20 bg-accent/5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <div className="sm:w-28 flex-shrink-0">
                <span className="font-display font-bold text-accent">PagePerfect</span>
                <div className="text-xs text-accent/60 mt-0.5">Free to start</div>
              </div>
              <div className="text-sm text-text-secondary">
                Professional XeLaTeX typesetting, baseline grids, golden-ratio type scales, 8 templates, 11 page sizes.
                Runs in any browser. No install.
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ===== FINAL CTA — Emotionally charged ===== */}
      <section className="py-28 md:py-36 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-[radial-gradient(ellipse,rgba(79,143,255,0.06)_0%,transparent_60%)]" />
        </div>
        <div className="mx-auto max-w-3xl px-6 md:px-8 relative">
          <h2 className="font-display text-h1 font-bold tracking-tight text-text-primary">
            Your manuscript deserves<br />
            <span className="gradient-accent-text">better than &ldquo;good enough.&rdquo;</span>
          </h2>
          <p className="mt-6 text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
            Open the editor, paste your text, and see the difference professional typesetting makes.
            Free. No account. No install.
          </p>
          <div className="mt-10">
            <Button size="lg" href="/app">Open the Editor</Button>
          </div>
        </div>
      </section>
    </main>
  )
}
