import { Hero } from '@/components/landing/Hero'
import { SocialProof } from '@/components/landing/SocialProof'
import { Comparison } from '@/components/landing/Comparison'
import { TemplateGrid } from '@/components/landing/TemplateGrid'
import { HowItWorks } from '@/components/landing/Steps'
import { WhyDifferent } from '@/components/landing/WhyDifferent'
import { Engineering } from '@/components/landing/Engineering'
import { PricingPreview } from '@/components/landing/PricingPreview'
import { FinalCTA } from '@/components/landing/FinalCTA'

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <SocialProof />
      <Comparison />
      <TemplateGrid />
      <HowItWorks />
      <WhyDifferent />
      <Engineering />
      <PricingPreview />
      <FinalCTA />
    </main>
  )
}
