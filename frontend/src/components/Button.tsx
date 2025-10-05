import Link from 'next/link'
import { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
  href?: string
}

export default function Button({ variant='primary', className='', href, ...rest }: Props) {
  const base = 'btn-pill'
  const style = variant === 'primary' ? 'btn-primary' : 'btn-secondary'
  const classes = `${base} ${style} ${className}`

  if (href) return <Link href={href} className={classes} role="button">{rest.children}</Link>
  return <button className={classes} {...rest} />
}
