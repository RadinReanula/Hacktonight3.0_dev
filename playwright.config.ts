import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  timeout: 60_000,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001',
    trace: 'on-first-retry'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          DATABASE_URL:
            process.env.DATABASE_URL ||
            'postgresql://postgres:supersecurepassword@localhost:5432/htn26db',
          SESSION_SECRET:
            process.env.SESSION_SECRET || 'dev-test-session-secret-min-16-chars'
        }
      }
})
