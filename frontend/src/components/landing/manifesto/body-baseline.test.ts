import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Body type on the 8-px baseline grid (Phase 1 §3.6, follow-up to PR #222).
 *
 * Tailwind `leading-N` → N × 0.25rem → N × 4 px (16-px root). For body line-
 * heights to land on the canonical 8-px baseline grid drawn by
 * `BaselineGridOverlay` (BASE = 8), the resolved px value must be divisible
 * by 8 — i.e. for Tailwind numeric leading, N must be even.
 *
 * This source-level test scans each landing-manifesto file for className
 * strings that pair a body-text size (`text-[NNpx]`, 11 ≤ NN ≤ 18) with an
 * explicit `leading-N` (or arbitrary `leading-[Npx]`), and asserts the
 * resulting line-height is on the 8-grid. Display tokens
 * (`leading-none|tight|tighter|snug|normal|relaxed|loose`) and elements
 * without an explicit leading are skipped — display headlines and inherited
 * leading are off-grid by canon (see Rigor Program §3.6).
 *
 * PR #222 ("body type on the 8-grid") landed `leading-7` (28 px) and
 * `leading-5` (20 px) on the primary body, marginalia, and footnotes —
 * both off the 8-grid. This test guards against that regression.
 */

const MANIFESTO_DIR = resolve(__dirname)

const FILES = [
  'ChapterOpener.tsx',
  'ChapterProblem.tsx',
  'ChapterTerms.tsx',
  'ChapterComparison.tsx',
  'ChapterAction.tsx',
  'ManifestoCover.tsx',
  'CoverSpecimen.tsx',
  'Marginalia.tsx',
  'Footnote.tsx',
] as const

const CLASSNAME_RE = /className=\s*(?:"([^"]+)"|'([^']+)')/g
const BODY_SIZE_RE = /text-\[(1[1-8])px\]/
const LEADING_RE = /\bleading-(\d+|\[[^\]]+\])\b/

function leadingToPx(value: string): number | null {
  const numeric = value.match(/^(\d+)$/)
  if (numeric) return parseInt(numeric[1], 10) * 4
  const arbitraryPx = value.match(/^\[(\d+(?:\.\d+)?)px\]$/)
  if (arbitraryPx) return parseFloat(arbitraryPx[1])
  return null
}

describe('manifesto body type sits on the 8-px baseline grid', () => {
  for (const file of FILES) {
    const src = readFileSync(resolve(MANIFESTO_DIR, file), 'utf8')
    const offenders: string[] = []
    let match: RegExpExecArray | null
    while ((match = CLASSNAME_RE.exec(src))) {
      const cls = match[1] ?? match[2] ?? ''
      if (!BODY_SIZE_RE.test(cls)) continue
      const leading = cls.match(LEADING_RE)
      if (!leading) continue
      const px = leadingToPx(leading[1])
      if (px === null) continue
      if (px % 8 !== 0) {
        offenders.push(`leading-${leading[1]} → ${px}px (not ÷ 8) · className="${cls}"`)
      }
    }
    it(`${file}: every body line-height is a multiple of 8 px`, () => {
      expect(offenders, `${file} has off-grid body leading`).toEqual([])
    })
  }
})
