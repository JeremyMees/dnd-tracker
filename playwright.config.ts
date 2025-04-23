import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './test/e2e/tests',
  outputDir: './test/e2e/results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: process.env.CI ? 'http://127.0.0.1:3000' : 'http://localhost:3000',
    trace: 'on-first-retry',
    storageState: './test/e2e/.auth/user.json',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './test/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run build && node .output/server/index.mjs',
    url: process.env.CI ? 'http://127.0.0.1:3000' : 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000 * 10, // 10 minutes
  },
})
