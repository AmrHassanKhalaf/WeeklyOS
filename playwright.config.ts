import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for WeeklyOS E2E tests.
 * Tests run against the local Vite dev server.
 * Set TEST_BASE_URL env var to run against a staging/preview URL.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Fail the build on CI if test.only is left accidentally */
  forbidOnly: !!process.env.CI,
  /* Retry on CI */
  retries: process.env.CI ? 2 : 0,
  /* Parallel workers */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter */
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  use: {
    baseURL: process.env.TEST_BASE_URL ?? 'http://localhost:5173',
    /* Collect trace on failure */
    trace: 'on-first-retry',
    /* Take screenshots on failure */
    screenshot: 'only-on-failure',
    /* Slow down on CI so animations settle */
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],

  /* Start the Vite dev server before tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
