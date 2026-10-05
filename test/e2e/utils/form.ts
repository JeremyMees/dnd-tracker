import type { Page } from 'playwright-core'

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
