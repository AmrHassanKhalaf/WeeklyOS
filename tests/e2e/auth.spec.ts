// tests/e2e/auth.spec.ts
// E2E test: Authentication flow
// Covers: Sign-in page renders → credentials entered → redirect to Dashboard

import { test, expect } from '@playwright/test'

// Load test credentials from environment variables so they're never hardcoded.
const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? ''
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? ''

test.describe('Authentication flow', () => {
  test.beforeEach(async ({ page }) => {
    // Always start from the root — the app redirects unauthenticated users to /signin
    await page.goto('/')
  })

  test('unauthenticated user sees the sign-in page', async ({ page }) => {
    // The app should redirect to /signin
    await page.waitForURL(/sign[-_]?in/i, { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: /sign in|log in|welcome/i })).toBeVisible()
  })

  test('can sign in with valid credentials and lands on Dashboard', async ({ page }) => {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip(true, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set')
    }

    await page.waitForURL(/sign[-_]?in/i, { timeout: 10_000 })

    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in|log in/i }).click()

    // After successful auth, the app redirects to the Dashboard
    await page.waitForURL('/', { timeout: 15_000 })
    await expect(page.getByText(/dashboard|week overview|weekly plan/i).first()).toBeVisible()
  })

  test('shows an error message for invalid credentials', async ({ page }) => {
    await page.waitForURL(/sign[-_]?in/i, { timeout: 10_000 })

    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in|log in/i }).click()

    // An error message should appear — check for common Supabase auth error wording
    await expect(
      page.getByText(/invalid|credentials|wrong|check your email|incorrect/i).first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('sign out returns to the sign-in page', async ({ page }) => {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip(true, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set')
    }

    await page.waitForURL(/sign[-_]?in/i, { timeout: 10_000 })
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await page.waitForURL('/', { timeout: 15_000 })

    // Open sidebar (if collapsed on mobile) and sign out
    const signOutButton = page.getByRole('button', { name: /sign out|logout/i })
    if (!(await signOutButton.isVisible())) {
      await page.getByRole('button', { name: /menu|sidebar|open/i }).first().click()
    }
    await signOutButton.click()

    await page.waitForURL(/sign[-_]?in/i, { timeout: 10_000 })
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })
})
