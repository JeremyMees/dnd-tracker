import { describe, expect, it } from 'vitest'
import { createPage, setup } from '@nuxt/test-utils/e2e'
import type { Page } from 'playwright-core'
import { host, storageState, testTitle } from '../helpers'

describe('campaigns', async () => {
  await setup({ host, browser: true })

  const title = testTitle('Campaign')
  const updatedTitle = testTitle('Renamed')

  function row(page: Page, text: string) {
    return page.getByRole('row').filter({ hasText: text })
  }

  async function submitCampaignForm(page: Page, value: string): Promise<void> {
    const dialog = page
      .getByRole('dialog')
      .filter({ has: page.getByTestId('title') })
    await dialog.getByTestId('title').fill(value)
    await dialog.getByTestId('submit').click()
    await dialog.waitFor({ state: 'detached' })
  }

  it('creates a campaign', async () => {
    const page = await createPage('/campaigns', { storageState })

    await page.getByTestId('create').click()
    await submitCampaignForm(page, title)
    await row(page, title).waitFor()

    expect(await row(page, title).count()).toBe(1)
  })

  it('opens the campaign from the listing', async () => {
    const page = await createPage('/campaigns', { storageState })

    await row(page, title).getByRole('link', { name: title }).click()
    await page.waitForURL(/\/campaigns\/\d+-.+\/encounters$/)

    expect(new URL(page.url()).pathname).toMatch(/\/encounters$/)
  })

  it('renames a campaign', async () => {
    const page = await createPage('/campaigns', { storageState })

    await row(page, title).getByRole('button', { name: 'Update' }).click()
    await submitCampaignForm(page, updatedTitle)
    await row(page, updatedTitle).waitFor()

    expect(await row(page, title).count()).toBe(0)
  })

  it('deletes a campaign', async () => {
    const page = await createPage('/campaigns', { storageState })

    await row(page, updatedTitle).getByRole('checkbox').click()
    await page.getByTestId('remove').click()
    await page.getByTestId('confirm-button').click()
    await row(page, updatedTitle).waitFor({ state: 'detached' })

    expect(await row(page, updatedTitle).count()).toBe(0)
  })
})
