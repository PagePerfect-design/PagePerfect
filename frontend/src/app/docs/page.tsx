import Container from '@/components/Container'
import Section from '@/components/Section'
import CopyCitation from '@/components/CopyCitation'
import AuthorGuideTools from '@/components/AuthorGuideTools'
import RequirementsCheck from './RequirementsCheck'
import Image from 'next/image'

export const metadata = {
  title: 'Docs — Page Perfect',
  description: 'Quick troubleshooting guide and citation helper for Page Perfect.',
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
              priority
            />
            <h1 className="font-display text-h1 font-black leading-tight tracking-tight">Docs</h1>
          </div>
          <p className="p mt-3 text-ens-gray-700">
            Quick tips to get your manuscript compiling smoothly. Use the helper below to copy a valid
            citation and test that your bibliography is set up.
          </p>
          <div className="mt-6"><CopyCitation /></div>
          <div className="mt-4"><AuthorGuideTools /></div>
          <div className="mt-6"><RequirementsCheck /></div>
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

            <div className="card p-5">
              <h2 className="h2 mb-2">Recommended Reading</h2>
              <p className="p mb-3">
                For a comprehensive understanding of grid systems in graphic design, we recommend Josef Müller-Brockmann&apos;s seminal work that inspired PagePerfect&apos;s systematic approach:
              </p>
              <div className="bg-ens-light p-4 rounded-lg">
                <p className="text-sm font-medium text-ens-midnight mb-2">📚 Grid Systems in Graphic Design</p>
                <p className="text-sm text-ens-gray-700 mb-3">Josef Müller-Brockmann</p>
                <a 
                  href="https://ia902309.us.archive.org/4/items/GridSystemsInGraphicDesignJosefMullerBrockmann/Grid%20systems%20in%20graphic%20design%20-%20Josef%20Muller-Brockmann.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-ens-blue hover:text-ens-blue-dark text-sm font-medium"
                >
                  Read the PDF →
                </a>
              </div>
              <p className="p mt-3 text-sm text-ens-gray-600">
                PagePerfect implements Müller-Brockmann&apos;s principles of systematic organization, baseline grids, and proportional typography for professional-quality PDF generation.
              </p>
            </div>
          </div>
        </Section>
      </Container>
    </main>
  )
}
