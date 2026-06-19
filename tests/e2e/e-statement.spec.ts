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

test.describe('E-Statement page E2E happy path', () => {
  test('renders page and allows filtering & downloading CSV', async ({
    page,
    context
  }) => {
    // Authenticate the session
    await authenticate(context)

    // Navigate to e-statement page
    await page.goto('/e-statement')

    // Verify page header title
    await expect(page.locator('h1')).toContainText('E-Statement')

    // Wait for the select trigger to load accounts and be visible
    const selectTrigger = page.locator('#account-select')
    await expect(selectTrigger).toBeVisible()

    // Set a wide date range to guarantee catching all seeded transactions
    await page.locator('#from-date').fill('2025-01-01')

    // Wait for either the table or the empty state to become visible (which ensures statement load finishes)
    const table = page.locator('table')
    const emptyState = page.locator('text=No transactions found')
    await expect(table.or(emptyState)).toBeVisible({ timeout: 15000 })

    // Verify default summary cards exist
    await expect(page.locator('p:has-text("Opening Balance")')).toBeVisible()
    await expect(page.locator('p:has-text("Closing Balance")')).toBeVisible()

    if (await table.isVisible()) {
      // Verify Download and Print buttons are visible
      const csvButton = page.locator('button:has-text("Download CSV")')
      await expect(csvButton).toBeVisible()
      const pdfButton = page.locator('button:has-text("Print / PDF")')
      await expect(pdfButton).toBeVisible()

      // Trigger CSV download click and wait for download event
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        csvButton.click()
      ])
      expect(download.suggestedFilename()).toContain('statement_')
    } else {
      await expect(emptyState).toBeVisible()
    }
  })
})
