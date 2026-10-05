import type { Page } from 'playwright-core'

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
