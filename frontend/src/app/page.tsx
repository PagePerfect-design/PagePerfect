import Container from '@/components/Container'
import Section from '@/components/Section'
import Button from '@/components/Button'
import Image from 'next/image'

export default function Home() {
  return (
    <main id="main" className="min-h-dvh bg-ens-white text-ens-dark">
      <Container>
        <Section>
          <header className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Image 
                src="/PagePerfect_1_Icon.png" 
                alt="Page Perfect" 
                width={64}
                height={64}
                className="h-16 w-16"
                priority
              />
              <h1 className="font-display text-hero font-black leading-tight tracking-tight">Page Perfect</h1>
            </div>
            <p className="p mt-4 max-w-2xl mx-auto text-ens-gray-700">
              ENS-inspired, accessible UI foundation for a professional typesetting MVP.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button>Get Started</Button>
              <Button variant="secondary" href="/app">Launch Editor</Button>
              <Button variant="secondary" href="/docs">Docs</Button>
            </div>
          </header>
        </Section>
      </Container>
    </main>
  )
}