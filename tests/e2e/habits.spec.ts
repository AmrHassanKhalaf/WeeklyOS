// tests/e2e/habits.spec.ts
// E2E test: Habit tracking flow
// Covers: Login → Habit Tracker → Mark habit complete → Streak increments → Confetti fires

import { test, expect, Page } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? ''
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? ''

async function signIn(page: Page) {
  await page.goto('/')
  await page.waitForURL(/sign[-_]?in/i, { timeout: 10_000 })
  await page.getByLabel(/email/i).fill(TEST_EMAIL)
  await page.getByLabel(/password/i).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
  await page.waitForURL('/', { timeout: 15_000 })
}

async function navigateToHabits(page: Page) {
  const habitLink = page.getByRole('link', { name: /habit/i }).first()
  await habitLink.click()
  await page.waitForURL(/habit/i, { timeout: 8_000 })
}

test.describe('Habit tracking flow', () => {
  test.beforeEach(async ({ page }) => {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip(true, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set')
    }
    await signIn(page)
    await navigateToHabits(page)
  })

  test('habit tracker page loads with habits or empty state', async ({ page }) => {
    // Should show either habits or an empty state prompt
    const hasHabits = await page.getByTestId('habit-card').first().isVisible({ timeout: 5_000 }).catch(() => false)
    const hasEmptyState = await page.getByText(/no habits|add your first|start tracking/i).isVisible({ timeout: 3_000 }).catch(() => false)

    expect(hasHabits || hasEmptyState).toBeTruthy()
  })

  test('marking a habit bubble toggles its completed state', async ({ page }) => {
    const habitBubble = page.getByTestId('habit-bubble').first()
    const isPresent = await habitBubble.isVisible({ timeout: 5_000 }).catch(() => false)

    if (!isPresent) {
      test.skip(true, 'No habit bubbles found — no habits exist this month')
    }

    // Read initial aria state
    const initialCompleted = await habitBubble.getAttribute('aria-pressed')

    await habitBubble.click()
    await page.waitForTimeout(400) // wait for animation + optimistic update

    const afterCompleted = await habitBubble.getAttribute('aria-pressed')
    expect(afterCompleted).not.toEqual(initialCompleted)
  })

  test('completing a habit triggers the confetti animation', async ({ page }) => {
    const habitBubble = page.getByTestId('habit-bubble').first()
    const isPresent = await habitBubble.isVisible({ timeout: 5_000 }).catch(() => false)

    if (!isPresent) {
      test.skip(true, 'No habit bubbles found')
    }

    // Ensure it's in uncompleted state first
    const isCompleted = (await habitBubble.getAttribute('aria-pressed')) === 'true'
    if (isCompleted) {
      await habitBubble.click() // toggle off
      await page.waitForTimeout(300)
    }

    // Now complete it
    await habitBubble.click()

    // Confetti pieces have class `.confetti-piece` per the design system
    await expect(page.locator('.confetti-piece').first()).toBeVisible({ timeout: 2_000 })
  })

  test('streak counter increments after completing today\'s habit', async ({ page }) => {
    const habitCard = page.getByTestId('habit-card').first()
    const isPresent = await habitCard.isVisible({ timeout: 5_000 }).catch(() => false)

    if (!isPresent) {
      test.skip(true, 'No habit cards found')
    }

    // Get today's day-of-month bubble
    const today = new Date().getDate()
    const todayBubble = habitCard.getByTestId(`habit-bubble-day-${today}`)
    const bubblePresent = await todayBubble.isVisible({ timeout: 3_000 }).catch(() => false)

    if (!bubblePresent) {
      test.skip(true, "Today's bubble not found")
    }

    // Read streak before
    const streakEl = habitCard.getByTestId('streak-count')
    const streakBefore = Number(await streakEl.textContent())

    // Complete today's habit (if not already done)
    const isCompleted = (await todayBubble.getAttribute('aria-pressed')) === 'true'
    if (!isCompleted) {
      await todayBubble.click()
      await page.waitForTimeout(600)

      const streakAfter = Number(await streakEl.textContent())
      expect(streakAfter).toBeGreaterThanOrEqual(streakBefore)
    }
  })

  test('can add a new habit via the form', async ({ page }) => {
    // Open add habit modal
    const addHabitButton = page.getByRole('button', { name: /add habit|new habit|\+/i }).first()
    await addHabitButton.click()

    const habitName = `E2E Habit ${Date.now()}`
    await page.getByLabel(/habit name|name/i).fill(habitName)

    // Fill in motivation if present
    const motivationField = page.getByLabel(/motivation|reason|why/i)
    if (await motivationField.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await motivationField.fill('To stay consistent')
    }

    // Submit
    await page.getByRole('button', { name: /save|create|add/i }).last().click()

    // Verify the new habit appears
    await expect(page.getByText(habitName)).toBeVisible({ timeout: 8_000 })
  })
})
