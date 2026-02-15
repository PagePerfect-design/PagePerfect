import { Hero } from '@/components/landing/Hero'
import { SocialProof } from '@/components/landing/SocialProof'
import { Comparison } from '@/components/landing/Comparison'
import { HowItWorks } from '@/components/landing/Steps'
import { TemplateShowcase } from '@/components/landing/TemplateShowcase'
import { WhyDifferent } from '@/components/landing/WhyDifferent'
import { PricingPreview } from '@/components/landing/PricingPreview'
import { FinalCTA } from '@/components/landing/FinalCTA'

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <SocialProof />
      <Comparison />
      <HowItWorks />
      <TemplateShowcase />
      <WhyDifferent />
      <PricingPreview />
      <FinalCTA />
    </main>
  )
}
