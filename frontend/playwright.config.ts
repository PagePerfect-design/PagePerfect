import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E test configuration for PagePerfect.
 *
 * Requires both frontend and backend running:
 *   cd backend && npm run dev   (port 4000)
 *   cd frontend && npm run dev  (port 3000)
 *
 * Or use the webServer config below to auto-start them.
 *
 * Run:
 *   npx playwright test                    # All tests
 *   npx playwright test --project=chromium # Chrome only
 *   npx playwright test e2e/smoke.spec.ts  # Specific test
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  // Auto-start the frontend dev server if not already running.
  // Backend must be started separately (or use docker-compose).
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
