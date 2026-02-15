import { Reveal } from './Reveal'

const STATS = [
  { value: '8', label: 'Professional templates' },
  { value: '11', label: 'Page sizes' },
  { value: 'Any', label: 'Browser, any OS' },
  { value: '$0', label: 'To start' },
]

export function SocialProof() {
  return (
    <section className="border-y border-white/[0.06] py-12">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <Reveal>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl font-bold text-text-primary md:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 font-mono text-xs uppercase tracking-widest text-text-ghost">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
