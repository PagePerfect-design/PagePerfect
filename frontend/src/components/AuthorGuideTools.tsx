'use client'

import { AUTHOR_GUIDE_MD } from '@/app/app/authorGuide'

export default function AuthorGuideTools() {
  async function copyGuide() {
    try {
      await navigator.clipboard.writeText(AUTHOR_GUIDE_MD)
      const btn = document.getElementById('copy-guide')
      if (btn) {
        const txt = btn.textContent
        btn.textContent = 'Copied!'
        setTimeout(() => { if (btn) btn.textContent = txt || 'Copy guide'; }, 1200)
      }
    } catch {/* ignore */}
  }
  
  function downloadGuide() {
    const blob = new Blob([AUTHOR_GUIDE_MD], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Page-Perfect-Author-Guide.md'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
  
  return (
    <div className="card p-4 flex flex-col gap-3 md:flex-row md:items-center">
      <div className="flex-1">
        <div className="font-semibold text-ens-midnight">Author Guide</div>
        <p className="text-sm text-ens-gray-700">
          Copy or download a ready-to-share Markdown guide for authors.
        </p>
      </div>
      <div className="flex gap-2">
        <button id="copy-guide" className="btn-pill btn-primary" onClick={copyGuide}>
          Copy guide
        </button>
        <button className="btn-pill btn-secondary" onClick={downloadGuide}>
          Download .md
        </button>
      </div>
    </div>
  )
}
