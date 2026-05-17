import type { ReactNode } from 'react'

interface FootnoteRefProps {
  /** 1-indexed footnote number. Engineer is responsible for keeping refs consistent within a chapter. */
  n: number
  /** Unique chapter slug — used to scope the anchor (avoids collisions across chapters). */
  chapter: string
}

export function FootnoteRef({ n, chapter }: FootnoteRefProps) {
  return (
    <sup className="ml-px font-mono text-[0.65em]">
      <a
        href={`#fn-${chapter}-${n}`}
        id={`fnref-${chapter}-${n}`}
        className="text-[#FF3333] underline-offset-2 hover:underline"
        aria-label={`Footnote ${n}`}
      >
        {n}
      </a>
    </sup>
  )
}

interface FootnoteListProps {
  chapter: string
  notes: { n: number; text: ReactNode }[]
}

export function FootnoteList({ chapter, notes }: FootnoteListProps) {
  return (
    <footer className="mt-16 border-t border-[#111111]/15 pt-6">
      <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.15em] text-[#555555]">
        Notes
      </p>
      <ol className="space-y-2">
        {notes.map(({ n, text }) => (
          <li
            key={n}
            id={`fn-${chapter}-${n}`}
            className="flex gap-4 font-mono text-[11px] leading-5 text-[#333333]"
          >
            <span className="shrink-0 text-[#555555]">{n}.</span>
            <span className="flex-1">
              {text}
              {' '}
              <a
                href={`#fnref-${chapter}-${n}`}
                className="text-[#FF3333] no-underline hover:underline"
                aria-label={`Back to reference ${n}`}
              >
                ↩
              </a>
            </span>
          </li>
        ))}
      </ol>
    </footer>
  )
}
