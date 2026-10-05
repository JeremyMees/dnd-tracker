import type { Locator, Page } from 'playwright-core'

export function row(page: Page, text: string): Locator {
  return page.getByRole('row').filter({ hasText: text })
}
