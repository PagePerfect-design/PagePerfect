const METADATA = [
  { label: 'Version', value: '2.0' },
  { label: 'Output', value: 'PDF/X-1a' },
  { label: 'Engine', value: 'LuaLaTeX' },
  { label: 'Platforms', value: 'KDP · IngramSpark · Lulu' },
  { label: 'Templates', value: '15' },
  { label: 'Status', value: 'Online' },
]

export function SocialProof() {
  return (
    <section className="border-b border-[#111111] bg-[#FDFCF8]">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-4">
          {METADATA.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/25">
                {item.label}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#111111]/60">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
