import { defineConfig } from 'vitest/config'

process.loadEnvFile('.env.e2e')

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
