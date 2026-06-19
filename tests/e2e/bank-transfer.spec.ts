import { expect, test } from '@playwright/test'
import { login } from './helpers'

test('bank transfer happy path', async ({ page }) => {
  await login(page)
  await page.goto('/bank-transfer', { waitUntil: 'domcontentloaded' })

  await expect(page.getByText('Transfer details')).toBeVisible({
    timeout: 30_000
  })
  await page.getByLabel('From account').click()
  await page.getByRole('option', { name: /Dilara Savings/ }).click()
  await page.getByLabel('To account number').fill('2000006754')
  await page.getByLabel('Amount (LKR)').fill('100')
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByText('Review transfer')).toBeVisible()
  await page.getByLabel('4-digit PIN').fill('1234')
  await page.getByRole('button', { name: 'Confirm transfer' }).click()

  await expect(page.getByRole('status')).toContainText('Transfer successful')
})
