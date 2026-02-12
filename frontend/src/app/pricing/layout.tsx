import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — PagePerfect',
  description: 'Free forever for basic typesetting. Pro when you need print-ready output.',
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
