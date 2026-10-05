import { existsSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
  test: {
    name: 'e2e',
    include: ['test/e2e/**/*.spec.ts'],
    environment: 'node',
    globalSetup: ['./test/e2e/global-setup.ts'],
    setupFiles: ['./test/e2e/setup.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
})
