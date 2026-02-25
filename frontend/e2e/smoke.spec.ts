import { test, expect } from '@playwright/test'

/**
 * Smoke tests — verify core pages load and critical UI elements render.
 * These run against a live dev server (no mocking).
 */

test.describe('Landing page', () => {
  test('loads and renders hero headline', async ({ page }) => {
    await page.goto('/')
    // The hero should contain the brand name or primary headline text
    await expect(page.locator('h1').first()).toBeVisible()
    // Page title should contain PagePerfect
    await expect(page).toHaveTitle(/PagePerfect/)
  })

  test('has navigation with key links', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav')).toBeVisible()
    // Key nav links should be present
    await expect(page.getByRole('link', { name: /pricing/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /journal/i })).toBeVisible()
  })

  test('has call-to-action button linking to editor', async ({ page }) => {
    await page.goto('/')
    // There should be at least one CTA linking to /app (the editor)
    const editorLinks = page.locator('a[href="/app"]')
    await expect(editorLinks.first()).toBeVisible()
  })
})

test.describe('Editor page', () => {
  test('loads the editor at /app', async ({ page }) => {
    await page.goto('/app')
    // Editor should have a textarea or contenteditable for manuscript input
    const editor = page.locator('textarea, [contenteditable="true"]').first()
    await expect(editor).toBeVisible({ timeout: 10_000 })
  })

  test('has template selector', async ({ page }) => {
    await page.goto('/app')
    // Should have a template selection mechanism
    const templateControl = page.locator('select, [role="listbox"], [data-template]').first()
    await expect(templateControl).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Pricing page', () => {
  test('displays three pricing tiers', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.locator('h1').first()).toBeVisible()
    // Should show Drafter, Publisher, Studio tiers
    await expect(page.getByText(/drafter/i).first()).toBeVisible()
    await expect(page.getByText(/publisher/i).first()).toBeVisible()
    await expect(page.getByText(/studio/i).first()).toBeVisible()
  })
})

test.describe('Journal page', () => {
  test('loads article index', async ({ page }) => {
    await page.goto('/journal')
    await expect(page.locator('h1').first()).toBeVisible()
    // Should have at least one article link
    const articleLinks = page.locator('a[href^="/journal/"]')
    await expect(articleLinks.first()).toBeVisible()
  })
})

test.describe('Docs page', () => {
  test('loads documentation hub', async ({ page }) => {
    await page.goto('/docs')
    await expect(page.locator('h1').first()).toBeVisible()
  })
})

test.describe('Auth pages', () => {
  test('login page renders sign-in form', async ({ page }) => {
    await page.goto('/auth/login')
    // Should have email and password inputs
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })
})

test.describe('Status page', () => {
  test('loads connectivity diagnostics', async ({ page }) => {
    await page.goto('/status')
    await expect(page.locator('h1').first()).toBeVisible()
  })
})

test.describe('Security headers', () => {
  test('returns Content-Security-Policy header', async ({ request }) => {
    const response = await request.get('/')
    const csp = response.headers()['content-security-policy']
    expect(csp).toBeTruthy()
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("object-src 'none'")
  })

  test('returns other security headers', async ({ request }) => {
    const response = await request.get('/')
    expect(response.headers()['x-content-type-options']).toBe('nosniff')
    expect(response.headers()['x-frame-options']).toBe('SAMEORIGIN')
    expect(response.headers()['referrer-policy']).toBeTruthy()
    expect(response.headers()['strict-transport-security']).toBeTruthy()
  })
})
