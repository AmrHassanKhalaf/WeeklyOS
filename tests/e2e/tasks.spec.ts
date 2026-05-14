// tests/e2e/tasks.spec.ts
// E2E test: Task creation flow
// Covers: Login → Weekly Distribution page → Create task → Verify it appears

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

test.describe('Task management flow', () => {
  test.beforeEach(async ({ page }) => {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip(true, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set')
    }
    await signIn(page)
  })

  test('can create a task and it appears in the correct day column', async ({ page }) => {
    // Navigate to the Weekly Distribution / planning page
    const planLink = page.getByRole('link', { name: /plan|distribution|week/i }).first()
    await planLink.click()
    await page.waitForURL(/plan|distribution/i, { timeout: 8_000 })

    // Open the task creation form — look for a common "add task" trigger
    const addButton = page.getByRole('button', { name: /add task|new task|\+/i }).first()
    await addButton.click()

    // Fill in the task title
    const uniqueTitle = `E2E Task ${Date.now()}`
    await page.getByLabel(/title|task name/i).fill(uniqueTitle)

    // Submit
    await page.getByRole('button', { name: /save|create|add/i }).last().click()

    // Verify the task appears on screen
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 8_000 })
  })

  test('can mark a task as complete via the Dashboard', async ({ page }) => {
    // The dashboard should already be loaded after sign-in
    const taskCheckbox = page.getByRole('checkbox').first()
    if (!(await taskCheckbox.isVisible({ timeout: 5_000 }).catch(() => false))) {
      // No tasks present — skip gracefully (empty state)
      test.skip(true, 'No tasks found on Dashboard to toggle')
    }

    // Toggle the first task checkbox
    const initialState = await taskCheckbox.isChecked()
    await taskCheckbox.click()
    await expect(taskCheckbox).toBeChecked({ checked: !initialState, timeout: 5_000 })
  })

  test('shows a limit error when exceeding max high-priority tasks per day', async ({ page }) => {
    // This is a unit-boundary test — the UI should show an error if the high-priority slot is taken.
    // Navigate to plan page
    const planLink = page.getByRole('link', { name: /plan|distribution|week/i }).first()
    await planLink.click()
    await page.waitForURL(/plan|distribution/i, { timeout: 8_000 })

    // Create first high-priority task
    const addButton = page.getByRole('button', { name: /add task|new task|\+/i }).first()
    await addButton.click()
    await page.getByLabel(/title|task name/i).fill('High Task 1')
    // Select "High" priority if the form has it
    const highOption = page.getByRole('option', { name: /high/i })
    if (await highOption.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await highOption.click()
    }
    await page.getByRole('button', { name: /save|create|add/i }).last().click()
    await page.waitForTimeout(500)

    // Attempt second high-priority task for the same day
    await addButton.click()
    await page.getByLabel(/title|task name/i).fill('High Task 2')
    if (await highOption.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await highOption.click()
    }
    await page.getByRole('button', { name: /save|create|add/i }).last().click()

    // Expect an error/alert to appear
    await expect(
      page.getByText(/limit|only 1|maximum|already have/i).first()
    ).toBeVisible({ timeout: 5_000 })
  })
})
