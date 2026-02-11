import Container from '@/components/Container'
import Section from '@/components/Section'
import CopyCitation from '@/components/CopyCitation'
import AuthorGuideTools from '@/components/AuthorGuideTools'
import RequirementsCheck from './RequirementsCheck'

export const metadata = {
  title: 'Docs — PagePerfect',
  description: 'Quick troubleshooting guide and citation helper for PagePerfect.',
}

export default function DocsPage() {
  return (
    <main id="main">
      <Container>
        <Section>
          <h1 className="font-display text-h1 font-bold tracking-tight text-text-primary mb-2">Documentation</h1>
          <p className="p mt-3">
            Quick tips to get your manuscript compiling smoothly. Use the helpers below to copy a valid
            citation and test that your bibliography is set up.
          </p>
          <div className="mt-6"><CopyCitation /></div>
          <div className="mt-4"><AuthorGuideTools /></div>
          <div className="mt-6"><RequirementsCheck /></div>
        </Section>

        <Section className="pt-0">
          <div className="grid gap-4">
            <div className="card p-6">
              <h2 className="font-display text-xl font-bold text-text-primary mb-3">Undefined citation</h2>
              <p className="p">
                If the error console shows <code className="text-accent text-sm">Undefined citations</code>, confirm the keys exist in
                <code className="text-accent text-sm"> references.bib</code> on the server and that your in-text cites use Pandoc syntax
                <code className="text-accent text-sm"> [@Key]</code> exactly.
              </p>
            </div>

            <div className="card p-6">
              <h2 className="font-display text-xl font-bold text-text-primary mb-3">No PDF / 400-501 errors</h2>
              <ul className="list-disc pl-5 text-text-secondary leading-7">
                <li>Make sure the compiler backend is running on <code className="text-accent text-sm">http://localhost:4000</code>.</li>
                <li>If using Docker: <code className="text-accent text-sm">npm run docker:build && npm run docker:run</code> in <code className="text-accent text-sm">backend/</code>.</li>
                <li>Network errors: check that your browser can reach <code className="text-accent text-sm">/api/health</code>.</li>
              </ul>
            </div>

            <div className="card p-6">
              <h2 className="font-display text-xl font-bold text-text-primary mb-3">Template or package issues</h2>
              <p className="p">
                If the console lists missing LaTeX packages, add them to the Dockerfile via
                <code className="text-accent text-sm"> tlmgr install &lt;package&gt;</code>, rebuild, and redeploy.
              </p>
            </div>

            <div className="card p-6">
              <h2 className="font-display text-xl font-bold text-text-primary mb-3">Style warnings</h2>
              <p className="p">
                Double spaces after punctuation are flagged as warnings. They won&apos;t stop compilation but are worth fixing for polish.
              </p>
            </div>

            <div className="card p-6">
              <h2 className="font-display text-xl font-bold text-text-primary mb-3">Recommended Reading</h2>
              <p className="p mb-4">
                PagePerfect&apos;s grid system is inspired by Josef Muller-Brockmann&apos;s systematic approach to graphic design — baseline grids, proportional typography, and mathematical spacing.
              </p>
              <div className="bg-surface-subtle p-4 rounded-lg border border-[rgba(255,255,255,0.04)]">
                <p className="text-sm font-medium text-text-primary mb-1">Grid Systems in Graphic Design</p>
                <p className="text-sm text-text-tertiary mb-3">Josef Muller-Brockmann</p>
                <a
                  href="https://ia902309.us.archive.org/4/items/GridSystemsInGraphicDesignJosefMullerBrockmann/Grid%20systems%20in%20graphic%20design%20-%20Josef%20Muller-Brockmann.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent hover:text-accent-hover text-sm font-medium transition-colors"
                >
                  Read the PDF
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </div>
          </div>
        </Section>
      </Container>
    </main>
  )
}
