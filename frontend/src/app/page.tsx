import { Hero } from '@/components/landing/Hero'
import { SocialProof } from '@/components/landing/SocialProof'
import { Comparison } from '@/components/landing/Comparison'
import { HowItWorks } from '@/components/landing/Steps'
import { TemplateGrid } from '@/components/landing/TemplateGrid'
import { WhyDifferent } from '@/components/landing/WhyDifferent'
import { PricingPreview } from '@/components/landing/PricingPreview'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { SectionTransition } from '@/components/landing/SectionTransition'

export default function Home() {
  return (
    <main id="main">
      {/* D → L → D → L → D → D → L → D */}
      <Hero />
      <SectionTransition to="light" />
      <SocialProof />
      <SectionTransition to="dark" />
      <Comparison />
      <SectionTransition to="light" />
      <HowItWorks />
      <SectionTransition to="dark" />
      <TemplateGrid />
      <WhyDifferent />
      <SectionTransition to="light" />
      <PricingPreview />
      <SectionTransition to="dark" />
      <FinalCTA />
    </main>
  )
}
