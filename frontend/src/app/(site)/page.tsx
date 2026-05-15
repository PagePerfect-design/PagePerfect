import { ManifestoFolio } from '@/components/landing/manifesto/ManifestoFolio'
import { ManifestoCover } from '@/components/landing/manifesto/ManifestoCover'
import { ChapterProblem } from '@/components/landing/manifesto/ChapterProblem'
import { ChapterComparison } from '@/components/landing/manifesto/ChapterComparison'
import { ChapterTemplates } from '@/components/landing/manifesto/ChapterTemplates'
import { ChapterEngine } from '@/components/landing/manifesto/ChapterEngine'
import { ChapterTerms } from '@/components/landing/manifesto/ChapterTerms'
import { ChapterAction } from '@/components/landing/manifesto/ChapterAction'

export default function Home() {
  return (
    <main id="main" className="relative">
      <ManifestoFolio />
      <ManifestoCover />
      <ChapterProblem />
      <ChapterComparison />
      <ChapterTemplates />
      <ChapterEngine />
      <ChapterTerms />
      <ChapterAction />
    </main>
  )
}
