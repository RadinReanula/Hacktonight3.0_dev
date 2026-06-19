import { expect, test } from '@playwright/test'
import { login } from './helpers'

test('dashboard shows overview data', async ({ page }) => {
  await login(page)
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByText('Total balance')).toBeVisible()
  await expect(page.getByText(/LKR\s+[\d,]+\.\d{2}/).first()).toBeVisible()
  await expect(page.getByText('Recent transactions')).toBeVisible()
  await expect(page.getByText('Dilara Savings').first()).toBeVisible()
})

test('bank accounts CRUD happy path', async ({ page }) => {
  await login(page)
  await page.goto('/bank-accounts', { waitUntil: 'domcontentloaded' })

  await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()
  await expect(page.getByText('Dilara Savings').first()).toBeVisible()

  const uniqueNumber = `9${Date.now().toString().slice(-9)}`
  const accountName = `E2E Account ${Date.now()}`

  await page.getByRole('button', { name: 'Add account' }).click()
  await page.getByLabel('Account number').fill(uniqueNumber)
  await page.getByLabel('Account name').fill(accountName)
  await page.getByRole('button', { name: 'Add account', exact: true }).click()

  await expect(page.getByText(accountName).first()).toBeVisible()

  await page.getByRole('button', { name: `Edit ${accountName}` }).click()
  const renamed = `${accountName} Renamed`
  await page.getByLabel('Account name').fill(renamed)
  await page.getByRole('button', { name: 'Save changes' }).click()

  await expect(
    page.locator('[data-slot="card-title"]', { hasText: renamed }).first()
  ).toBeVisible()

  await page.getByRole('button', { name: `Delete ${renamed}` }).click()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()

  await expect(
    page.locator('[data-slot="card-title"]', { hasText: renamed })
  ).toHaveCount(0)
})
