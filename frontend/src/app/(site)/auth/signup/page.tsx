import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AuthForm } from '../_components/AuthForm'

export const metadata: Metadata = {
  title: 'Create your account — PagePerfect',
  description: 'Create a free PagePerfect account. Free to start, upgrade anytime.',
  openGraph: {
    title: 'Create your account — PagePerfect',
    description: 'Create a free PagePerfect account. Free to start, upgrade anytime.',
    type: 'website',
    images: ['/og-image.png'],
  },
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
          <div className="h-6 w-6 animate-spin border-2 border-[#FF3333] border-t-transparent" />
        </div>
      }
    >
      <AuthForm initialMode="signup" />
    </Suspense>
  )
}
