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
  const banner = page.getByTestId('banner')
  const shown = await banner.waitFor({ timeout: 5_000 }).then(
    () => true,
    () => false,
  )

  if (!shown) return

  await banner.getByTestId('reject-all').click()
  await banner.waitFor({ state: 'detached' })
}
