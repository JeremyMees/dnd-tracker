import { createPage } from '@nuxt/test-utils/e2e'
import type { Locator, Page } from 'playwright-core'

export const host = process.env.E2E_HOST ?? 'http://localhost:3000'
export const storageState = 'test/e2e/.auth/user.json'
export const prefix = '[e2e]'

export async function openPage(
  path: string,
  { signedIn = true } = {},
): Promise<Page> {
  const page = await createPage(path, signedIn ? { storageState } : {})
  page.setDefaultTimeout(10_000)

  return page
}

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

export function row(page: Page, text: string): Locator {
  return page.getByRole('row').filter({ hasText: text })
}

export async function submitTitleForm(
  page: Page,
  title: string,
): Promise<void> {
  const dialog = page
    .getByRole('dialog')
    .filter({ has: page.getByTestId('title') })
  await dialog.getByTestId('title').fill(title)
  await dialog.getByTestId('submit').click()
  await dialog.waitFor({ state: 'detached' })
}
