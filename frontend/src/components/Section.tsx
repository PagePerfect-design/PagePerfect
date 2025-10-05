import { PropsWithChildren } from 'react'

type Props = PropsWithChildren<{ variant?: 'light' | 'dark'; className?: string }>

export default function Section({ children, variant='light', className='' }: Props) {
  const tone = variant === 'dark' ? 'section-dark' : ''
  return <section className={`py-14 md:py-20 ${tone} ${className}`}>{children}</section>
}
