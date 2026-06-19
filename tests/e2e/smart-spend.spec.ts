import fs from 'node:fs'
import path from 'node:path'
import { type BrowserContext, expect, test } from '@playwright/test'
import { SignJWT } from 'jose'

function getSecret() {
  let secret = process.env.SESSION_SECRET
  if (!secret) {
    try {
      const envPath = path.resolve(process.cwd(), '.env.local')
      const content = fs.readFileSync(envPath, 'utf8')
      const match = content.match(/^SESSION_SECRET=(.+)$/m)
      if (match) {
        secret = match[1].trim()
      }
    } catch (_) {}
  }
  return new TextEncoder().encode(
    secret || 'dev-only-insecure-session-secret-change-me'
  )
}

async function authenticate(context: BrowserContext) {
  const secret = getSecret()
  const token = await new SignJWT({
    userId: 1,
    role: 'customer',
    username: 'dilara'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(secret)

  await context.addCookies([
    {
      name: 'nova_session',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 3600
    }
  ])
}

test.describe('Smart Spend page E2E happy path', () => {
  test('renders dashboard metrics and switches periods', async ({
    page,
    context
  }) => {
    // Authenticate the session
    await authenticate(context)

    // Navigate to smart spend page
    await page.goto('/smart-spend')

    // Verify page header title
    await expect(page.locator('h1')).toContainText('Smart Spend')

    // Check period selector is visible
    const selectTrigger = page.locator('button:has-text("This Month")')
    await expect(selectTrigger).toBeVisible()

    // Verify KPI cards are visible
    await expect(page.locator('p:has-text("Total Spent")')).toBeVisible()
    await expect(page.locator('p:has-text("Total Income")')).toBeVisible()
    await expect(page.locator('p:has-text("Net Cash Flow")')).toBeVisible()

    // Verify charts and lists are visible
    await expect(
      page.locator('[data-slot="card-title"]:has-text("Spend by Category")')
    ).toBeVisible()
    await expect(
      page.locator('[data-slot="card-title"]:has-text("Spend over Time")')
    ).toBeVisible()
    await expect(
      page.locator(
        '[data-slot="card-title"]:has-text("Top Payees & Merchants")'
      )
    ).toBeVisible()
    await expect(
      page.locator('[data-slot="card-title"]:has-text("Category Budgets")')
    ).toBeVisible()

    // Open period selector and change period
    await selectTrigger.click()
    await page.locator('span:has-text("Last Month")').click()

    // Check that selector text updated to "Last Month"
    await expect(page.locator('button:has-text("Last Month")')).toBeVisible()
  })
})
