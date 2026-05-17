'use client'

/**
 * BaselineGridOverlay — dev-only visualisation of the 8-grid baseline +
 * 12-column modular grid. Per Rigor Program §2.1 + §3.6, every text
 * block must sit on the 8-grid and every spacing value must be an
 * 8-multiple. This overlay makes drift visible at a glance.
 *
 * Activation:
 *   ?grid=1            — baseline grid (8px horizontal hairlines)
 *   ?grid=cols         — 12-col modular grid (24px gutter)
 *   ?grid=1,cols       — both
 *
 * No-op in production. Toggles instantly on URL change. Honors
 * `prefers-reduced-motion` by never animating.
 */

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const ENABLED = process.env.NODE_ENV !== 'production'
const BASE = 8 // px — the canonical baseline unit
const COL_MAX = 1200 // px — Rigor Program §2.1 content max-width
const COL_COUNT = 12
const GUTTER = 24 // px

export function BaselineGridOverlay() {
  // Hooks must run unconditionally; we gate render via a flag.
  const params = useSearchParams()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!ENABLED) return null
  if (!mounted) return null

  const flag = params.get('grid') || ''
  const tokens = flag.split(',').map((t) => t.trim()).filter(Boolean)
  const showBaseline = tokens.includes('1') || tokens.includes('baseline') || tokens.includes('on')
  const showColumns = tokens.includes('cols') || tokens.includes('columns')
  if (!showBaseline && !showColumns) return null

  // Suppress overlay inside the editor — its own canvas semantics differ.
  if (pathname?.startsWith('/app')) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {showBaseline && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              to bottom,
              transparent 0,
              transparent ${BASE - 1}px,
              rgba(255, 51, 51, 0.18) ${BASE - 1}px,
              rgba(255, 51, 51, 0.18) ${BASE}px
            )`,
            backgroundSize: `100% ${BASE}px`,
          }}
        />
      )}
      {showColumns && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '50%',
            width: `${COL_MAX}px`,
            maxWidth: '100vw',
            transform: 'translateX(-50%)',
            display: 'grid',
            gridTemplateColumns: `repeat(${COL_COUNT}, 1fr)`,
            columnGap: `${GUTTER}px`,
            padding: `0 ${GUTTER}px`,
          }}
        >
          {Array.from({ length: COL_COUNT }).map((_, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255, 51, 51, 0.07)',
                borderLeft: '1px dashed rgba(255, 51, 51, 0.35)',
                borderRight: i === COL_COUNT - 1 ? '1px dashed rgba(255, 51, 51, 0.35)' : 'none',
              }}
            />
          ))}
        </div>
      )}
      {/* Tiny legend so dev can verify the overlay loaded */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          background: '#111111',
          color: '#FDFCF8',
          padding: '4px 8px',
          fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          opacity: 0.9,
        }}
      >
        GRID · {showBaseline ? `8PX` : ''}{showBaseline && showColumns ? ' · ' : ''}{showColumns ? `${COL_COUNT}-COL` : ''}
      </div>
    </div>
  )
}
