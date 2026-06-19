import { expect, test } from '@playwright/test'
import { login } from './helpers'

test('pay bills happy path', async ({ page }) => {
  await login(page)
  await page.goto('/pay-bills', { waitUntil: 'domcontentloaded' })

  await expect(
    page.getByRole('button', { name: /Ceylon Electricity Board/ })
  ).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /Ceylon Electricity Board/ }).click()

  await page.getByLabel('From account').click()
  await page.getByRole('option', { name: /Dilara Savings/ }).click()
  await page.getByLabel('Bill / account reference').fill('CEB-123456')
  await page.getByLabel('Amount (LKR)').fill('250')
  await page.getByLabel('4-digit PIN').fill('1234')
  await page.getByRole('button', { name: 'Pay bill' }).click()

  await expect(page.getByRole('status')).toContainText('Payment successful')
})
