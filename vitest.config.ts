import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    testTimeout: 30_000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  }
})
