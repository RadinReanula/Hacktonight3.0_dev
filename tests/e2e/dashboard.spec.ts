import { expect, test } from '@playwright/test'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByLabel('Username').fill('dilara')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/dashboard')
}

test('dashboard shows overview data', async ({ page }) => {
  await login(page)
  await page.goto('/dashboard')

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByText('142,000')).toBeVisible()
  await expect(page.getByText('Recent transactions')).toBeVisible()
  await expect(page.getByText('Lunch money')).toBeVisible()
})

test('bank accounts CRUD happy path', async ({ page }) => {
  await login(page)
  await page.goto('/bank-accounts')

  await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()
  await expect(page.getByText('Dilara Savings')).toBeVisible()

  const uniqueNumber = `9${Date.now().toString().slice(-9)}`

  await page.getByRole('button', { name: 'Add account' }).click()
  await page.getByLabel('Account number').fill(uniqueNumber)
  await page.getByLabel('Account name').fill('Test Account')
  await page.getByRole('button', { name: 'Add account', exact: true }).click()

  await expect(page.getByText('Test Account')).toBeVisible()

  await page.getByRole('button', { name: 'Edit Test Account' }).click()
  await page.getByLabel('Account name').fill('Renamed Account')
  await page.getByRole('button', { name: 'Save changes' }).click()

  await expect(page.getByText('Renamed Account')).toBeVisible()

  await page.getByRole('button', { name: 'Delete Renamed Account' }).click()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()

  await expect(page.getByText('Renamed Account')).not.toBeVisible()
})
