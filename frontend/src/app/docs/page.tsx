import Container from '@/components/Container'
import Section from '@/components/Section'
import CopyCitation from '@/components/CopyCitation'
import Image from 'next/image'
import { AUTHOR_GUIDE_MD } from '@/app/app/authorGuide'

export const metadata = {
  title: 'Docs — Page Perfect',
  description: 'Quick troubleshooting guide and citation helper for Page Perfect.',
}

function AuthorGuideTools() {
  'use client'
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


export default function DocsPage() {
  return (
    <main id="main" className="min-h-dvh bg-ens-white text-ens-dark">
      <Container>
        <Section>
          <div className="flex items-center gap-4 mb-6">
            <Image 
              src="/PagePerfect_1_Icon.png" 
              alt="Page Perfect" 
              width={48}
              height={48}
              className="h-12 w-12"
            />
            <h1 className="font-display text-h1 font-black leading-tight tracking-tight">Docs</h1>
          </div>
          <p className="p mt-3 text-ens-gray-700">
            Quick tips to get your manuscript compiling smoothly. Use the helper below to copy a valid
            citation and test that your bibliography is set up.
          </p>
          <div className="mt-6"><CopyCitation /></div>
          <div className="mt-4"><AuthorGuideTools /></div>
        </Section>

        <Section className="pt-0">
          <div className="grid gap-4">
            <div className="card p-5">
              <h2 className="h2 mb-2">Undefined citation</h2>
              <p className="p">
                If the error console shows <code>Undefined citations</code>, confirm the keys exist in
                <code> references.bib</code> on the server and that your in-text cites use the Pandoc syntax
                <code> [@Key]</code> exactly. Example: <code>[@Finch2023]</code>.
              </p>
            </div>

            <div className="card p-5">
              <h2 className="h2 mb-2">No PDF / 400–501 errors</h2>
              <ul className="list-disc pl-5 text-base leading-7">
                <li>Make sure the compiler backend is running on <code>http://localhost:4000</code>.</li>
                <li>If using Docker, run: <code>npm run docker:build</code> then <code>npm run docker:run</code> in <code>backend/</code>.</li>
                <li>Network errors: check that your browser can reach <code>/health</code>.</li>
              </ul>
            </div>

            <div className="card p-5">
              <h2 className="h2 mb-2">Template or package issues</h2>
              <p className="p">
                If the console lists missing LaTeX packages, a maintainer should add them to the Dockerfile via
                <code> tlmgr install &lt;package&gt;</code>, rebuild, and rerun.
              </p>
            </div>

            <div className="card p-5">
              <h2 className="h2 mb-2">Style warnings (non-fatal)</h2>
              <p className="p">
                Double spaces after punctuation are flagged as warnings. They won&apos;t stop compilation but are worth fixing for polish.
              </p>
            </div>
          </div>
        </Section>
      </Container>
    </main>
  )
}
