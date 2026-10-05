import { createPage } from '@nuxt/test-utils/e2e'
import type { Page } from 'playwright-core'
import { storageState } from './auth'

export async function openPage(
  path: string,
  { signedIn = true } = {},
): Promise<Page> {
  const page = await createPage(path, signedIn ? { storageState } : {})
  page.setDefaultTimeout(10_000)

  return page
}
