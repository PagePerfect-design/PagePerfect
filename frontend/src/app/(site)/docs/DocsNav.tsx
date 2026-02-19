'use client'

import { useEffect, useState } from 'react'

type NavSection = {
  id: string
  label: string
  group?: string
}

const SECTIONS: NavSection[] = [
  { group: 'Getting Started', id: 'quickstart', label: 'Quick Start' },
  { id: 'requirements', label: 'Requirements Check' },
  { group: 'Reference', id: 'templates', label: 'Typographic Systems' },
  { id: 'template-symphony', label: 'Symphony' },
  { id: 'template-chicago', label: 'Chicago' },
  { id: 'template-paperback', label: 'Paperback' },
  { id: 'template-chronicle', label: 'Chronicle' },
  { id: 'template-exhibit', label: 'Exhibit' },
  { id: 'template-matrix', label: 'Matrix' },
  { id: 'template-avantgarde', label: 'Avant-Garde' },
  { id: 'template-minimal', label: 'Minimal' },
  { id: 'template-international', label: 'International' },
  { id: 'template-cinema', label: 'Cinema' },
  { id: 'template-heirloom', label: 'Heirloom' },
  { id: 'template-operator', label: 'Operator' },
  { group: 'Publishing', id: 'kdp', label: 'Amazon KDP' },
  { id: 'trim-sizes', label: 'Trim Sizes' },
  { id: 'gutters', label: 'Dynamic Gutter' },
  { id: 'spine', label: 'Spine Width' },
  { group: 'Automation', id: 'automation', label: 'Publishing Automation' },
  { id: 'preflight', label: 'Pre-flight Validator' },
  { id: 'cover-dimensions', label: 'Cover Dimensions' },
  { id: 'pdfx', label: 'PDF/X-1a Export' },
  { id: 'lulu', label: 'Lulu xPress API' },
  { id: 'platform-comparison', label: 'Platform Comparison' },
  { group: 'Support', id: 'troubleshooting', label: 'Troubleshooting' },
]

export default function DocsNav() {
  const [activeId, setActiveId] = useState('quickstart')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    const ids = SECTIONS.map((s) => s.id)
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
      history.replaceState(null, '', `#${id}`)
    }
  }

  let lastGroup = ''

  return (
    <nav className="docs-sidebar py-6" aria-label="Documentation navigation">
      {SECTIONS.map((s) => {
        const showGroup = s.group && s.group !== lastGroup
        if (s.group) lastGroup = s.group
        const isTemplate = s.id.startsWith('template-')

        return (
          <div key={s.id}>
            {showGroup && (
              <div className="docs-sidebar-group">{s.group}</div>
            )}
            <a
              href={`#${s.id}`}
              data-active={activeId === s.id ? 'true' : undefined}
              onClick={(e) => handleClick(e, s.id)}
              style={isTemplate ? { paddingLeft: '2.25rem', fontSize: '0.75rem' } : undefined}
            >
              {s.label}
            </a>
          </div>
        )
      })}
    </nav>
  )
}
