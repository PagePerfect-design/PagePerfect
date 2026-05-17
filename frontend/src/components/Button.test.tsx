import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Button from './Button'

describe('Button', () => {
  it('renders as a native <button> when no href is passed', () => {
    render(<Button>Click me</Button>)
    const el = screen.getByRole('button', { name: 'Click me' })
    expect(el.tagName).toBe('BUTTON')
  })

  it('renders as a <Link> with role="button" when href is passed', () => {
    render(<Button href="/pricing">Pricing</Button>)
    const el = screen.getByRole('button', { name: 'Pricing' })
    expect(el.tagName).toBe('A')
    expect(el).toHaveAttribute('href', '/pricing')
  })

  it('applies the primary variant by default', () => {
    render(<Button>Default</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-primary')
  })

  it('applies the secondary variant when specified', () => {
    render(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-secondary')
  })

  it('applies the ghost variant when specified', () => {
    render(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-ghost')
  })

  it('applies the md size by default', () => {
    render(<Button>Default size</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-sm')
  })

  it('applies the sm size class set when size="sm"', () => {
    render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2', 'text-xs')
  })

  it('applies the lg size class set when size="lg"', () => {
    render(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-8', 'py-4', 'text-base')
  })

  it('respects the disabled attribute when rendered as a <button>', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('forwards arbitrary HTML attributes (type, data-*)', () => {
    render(
      <Button type="submit" data-testid="submit-btn">
        Submit
      </Button>,
    )
    const el = screen.getByTestId('submit-btn')
    expect(el).toHaveAttribute('type', 'submit')
  })

  it('appends custom className alongside the canonical classes', () => {
    render(<Button className="custom-extra">Extra</Button>)
    const el = screen.getByRole('button')
    expect(el).toHaveClass('btn-primary', 'custom-extra')
  })
})
