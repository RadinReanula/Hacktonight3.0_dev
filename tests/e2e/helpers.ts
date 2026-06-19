import { expect, type Page } from '@playwright/test'

export async function login(page: Page) {
  const response = await page.request.post('/api/auth/login', {
    data: { username: 'dilara', password: 'password123' }
  })
  expect(response.ok()).toBeTruthy()
}
