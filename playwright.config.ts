import { defineConfig, devices } from '@playwright/test'

// Defaults point E2E at a local Nuxt server talking to the test backend on Render.
// Override any of these via environment variables (CI sets them in the workflow).
process.env.E2E_BASE_URL ??= 'http://localhost:3000'
process.env.E2E_API_BASE_URL ??= 'https://shopmarker-backend.onrender.com'
// An in-stock product on the test backend (see e2e/guest-checkout.spec.ts).
process.env.E2E_PRODUCT_ID ??= '9264'
process.env.E2E_PRODUCT_PRICE ??= '2199'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // The checkout spec creates real orders on the test backend — never auto-retry.
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'html',
  use: {
    baseURL: process.env.E2E_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Chromium only: each browser would place its own real order on the test backend.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // CI builds first (see workflow) and serves the build; locally we use the dev server.
  webServer: {
    command: process.env.CI ? 'npm run preview' : 'npm run dev',
    url: process.env.E2E_BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
