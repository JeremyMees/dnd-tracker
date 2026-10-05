import type { Page } from 'playwright-core'

export const host = process.env.E2E_HOST ?? 'http://localhost:3000'
export const storageState = 'test/e2e/.auth/user.json'
export const prefix = '[e2e]'

export function requireEnv(name: string): string {
  const value = process.env[name]

  if (!value) throw new Error(`Missing ${name} for the e2e run`)

  return value
}

export function testTitle(name: string): string {
  return `${prefix} ${name} ${Date.now()}`
}

export async function dismissConsent(page: Page): Promise<void> {
  const reject = page.getByTestId('reject-all')

  if (await reject.isVisible()) await reject.click()
}
