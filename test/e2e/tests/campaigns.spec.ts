import { describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { host, openPage, row, submitTitleForm, testTitle } from '../helpers'

describe('campaigns', async () => {
  await setup({ host, browser: true })

  const title = testTitle('Campaign')
  const updatedTitle = testTitle('Renamed')

  it('creates a campaign', async () => {
    const page = await openPage('/campaigns')

    await page.getByTestId('create').click()
    await submitTitleForm(page, title)
    await row(page, title).waitFor()

    expect(await row(page, title).count()).toBe(1)
  })

  it('opens the campaign from the listing', async () => {
    const page = await openPage('/campaigns')

    await row(page, title).getByRole('link', { name: title }).click()
    await page.waitForURL(/\/campaigns\/\d+-.+\/encounters$/)

    expect(new URL(page.url()).pathname).toMatch(/\/encounters$/)
  })

  it('renames a campaign', async () => {
    const page = await openPage('/campaigns')

    await row(page, title).getByRole('button', { name: 'Update' }).click()
    await submitTitleForm(page, updatedTitle)
    await row(page, updatedTitle).waitFor()

    expect(await row(page, title).count()).toBe(0)
  })

  it('deletes a campaign', async () => {
    const page = await openPage('/campaigns')

    await row(page, updatedTitle).getByRole('checkbox').click()
    await page.getByTestId('remove').click()
    await page.getByTestId('confirm-button').click()
    await row(page, updatedTitle).waitFor({ state: 'detached' })

    expect(await row(page, updatedTitle).count()).toBe(0)
  })
})
