import { test, expect } from '@playwright/test'

/**
 * Compile flow E2E tests — verify the full manuscript → PDF pipeline.
 * Requires a running backend with Pandoc/LuaLaTeX installed.
 *
 * These tests are skipped in CI unless BACKEND_AVAILABLE=true is set,
 * because they require a fully configured backend with LaTeX toolchain.
 */

const BACKEND_AVAILABLE = process.env.BACKEND_AVAILABLE === 'true'

test.describe('Compile flow', () => {
  test.skip(!BACKEND_AVAILABLE, 'Requires running backend with Pandoc/LuaLaTeX')

  test('can type manuscript and trigger preview', async ({ page }) => {
    await page.goto('/app')

    // Wait for the editor to be ready
    const editor = page.locator('textarea, [contenteditable="true"]').first()
    await expect(editor).toBeVisible({ timeout: 10_000 })

    // Type a simple manuscript
    await editor.fill('# Test Chapter\n\nThis is a test paragraph for the E2E compile flow.')

    // The editor should auto-compile after debounce (1-3 seconds)
    // Wait for the PDF preview iframe or status indicator
    const pdfPreview = page.locator('iframe, [data-pdf-preview]').first()
    await expect(pdfPreview).toBeVisible({ timeout: 30_000 })
  })

  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(body.status).toBe('ok')
  })

  test('templates endpoint returns template list', async ({ request }) => {
    const response = await request.get('/api/templates')
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(Object.keys(body).length).toBeGreaterThanOrEqual(15)
  })
})
