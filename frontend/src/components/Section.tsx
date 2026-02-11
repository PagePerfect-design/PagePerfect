import { PropsWithChildren } from 'react'

type Props = PropsWithChildren<{ variant?: 'default' | 'raised' | 'light' | 'dark'; className?: string; id?: string }>

export default function Section({ children, variant='default', className='', id }: Props) {
  const bg: Record<string, string> = {
    default: '',
    raised: 'bg-surface-raised',
    light: '',
    dark: 'section-dark',
  }
  return <section id={id} className={`py-16 md:py-24 ${bg[variant]} ${className}`}>{children}</section>
}
