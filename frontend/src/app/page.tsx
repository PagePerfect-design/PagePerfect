import { Hero } from '@/components/landing/Hero'
import { SocialProof } from '@/components/landing/SocialProof'
import { Comparison } from '@/components/landing/Comparison'
import { HowItWorks } from '@/components/landing/Steps'
import { TemplateGallery } from '@/components/landing/TemplateGallery'
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
      <TemplateGallery />
      <WhyDifferent />
      <PricingPreview />
      <FinalCTA />
    </main>
  )
}
