'use client'

/* ═══════════════════════════════════════════════════════════════════
   TEMPLATE CARD — Uniform specimen card for template selection
   Every card is exactly the same height. The specimen inside uses
   unique alignment, size, weight, and rules per template.
   ═══════════════════════════════════════════════════════════════════ */

import type { TemplateKey, TemplateEntry, SpecimenStyle } from './editor-types'

/** Renders the type specimen from a SpecimenStyle config */
function Specimen({ spec, active }: { spec: SpecimenStyle; active: boolean }) {
  const fontClass =
    spec.font === 'mono' ? 'font-mono' :
    spec.font === 'serif' ? 'font-body' :
    'font-display'

  const weightClass =
    spec.weight === 'black' ? 'font-black' :
    spec.weight === 'bold' ? 'font-bold' :
    spec.weight === 'medium' ? 'font-medium' :
    'font-normal'

  const alignClass =
    spec.align === 'center' ? 'text-center' :
    spec.align === 'right' ? 'text-right' :
    'text-left'

  return (
    <div className={`relative flex-1 flex flex-col justify-center ${alignClass}`}>
      {(spec.rule === 'top' || spec.rule === 'both') && (
        <div className={`mb-1.5 h-px ${active ? 'bg-[#111111]/20' : 'bg-[#111111]/10'}`} />
      )}
      <p
        className={`truncate leading-none ${fontClass} ${weightClass} ${
          spec.italic ? 'italic' : ''
        } ${active ? 'text-[#111111]' : 'text-[#111111]/50'}`}
        style={{
          fontSize: `${spec.size}px`,
          letterSpacing: spec.tracking ? `${spec.tracking}em` : undefined,
          textTransform: spec.uppercase ? 'uppercase' : undefined,
        }}
      >
        {spec.text}
      </p>
      {(spec.rule === 'bottom' || spec.rule === 'both') && (
        <div className={`mt-1.5 h-px ${active ? 'bg-[#111111]/20' : 'bg-[#111111]/10'}`} />
      )}
    </div>
  )
}

/** Uniform template card — fixed height, unique specimen per template */
export default function TemplateCard({
  templateKey,
  info,
  active,
  onClick,
}: {
  templateKey: TemplateKey
  info: TemplateEntry
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-[72px] flex-col border p-2 text-left transition-all duration-150 ${
        active
          ? 'border-[#FF3333] bg-[#FF3333]/[0.03]'
          : 'border-[#e5e5e0] hover:border-[#111111]/30 hover:bg-[#111111]/[0.01]'
      }`}
    >
      {/* Specimen area — flex-1 fills available space, centers content */}
      <Specimen spec={info.spec} active={active} />
      {/* Footer — always at the bottom, same position in every card */}
      <div className="mt-auto flex items-end justify-between gap-1 pt-1">
        <span className={`truncate font-mono text-[9px] leading-none ${active ? 'text-[#111111]/70' : 'text-[#111111]/40'}`}>
          {info.name}
        </span>
        <span className={`shrink-0 font-mono text-[7px] uppercase leading-none tracking-[0.08em] ${
          active ? 'text-[#FF3333]/60' : 'text-[#111111]/25'
        }`}>
          {info.kind}
        </span>
      </div>
    </button>
  )
}
