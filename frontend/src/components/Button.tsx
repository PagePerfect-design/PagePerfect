import Link from 'next/link'
import { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  href?: string
}

export default function Button({ variant='primary', size='md', className='', href, ...rest }: Props) {
  const base = 'btn-pill'
  const styles: Record<string, string> = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
  }
  const sizes: Record<string, string> = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  }
  const classes = `${base} ${styles[variant]} ${sizes[size]} ${className}`

  if (href) return <Link href={href} className={classes} role="button">{rest.children}</Link>
  return <button className={classes} {...rest} />
}
