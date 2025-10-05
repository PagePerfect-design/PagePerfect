'use client'
import Button from './Button'

export default function CopyCitation() {
  const cite = "[@Finch2023]"
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cite)
      const btn = document.getElementById('copy-cite-btn')
      if (btn) {
        const original = btn.textContent
        btn.textContent = 'Copied!'
        setTimeout(() => { if (btn) btn.textContent = original || 'Copy citation'; }, 1300)
      }
    } catch {
      // noop: clipboard blocked (fallback is manual select)
    }
  }
  return (
    <div className="card p-4 flex flex-col md:flex-row items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="small-mono">Example citation:</span>
        <code className="rounded bg-ens-light px-2 py-1">[@Finch2023]</code>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button id="copy-cite-btn" className="btn-pill btn-primary" onClick={copy}>
          Copy citation
        </button>
        <Button variant="secondary" href="/app">Go to Editor</Button>
      </div>
    </div>
  )
}
