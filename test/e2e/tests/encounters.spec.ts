import { describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { host, testTitle, openPage, row, submitTitleForm } from '../utils'

describe('encounters', async () => {
  await setup({ host, browser: true })

  const title = testTitle('Encounter')
  const updatedTitle = testTitle('Renamed')
  const copyTitle = `copy ${updatedTitle}`.slice(0, 30)

  it('creates an encounter', async () => {
    const page = await openPage('/encounters')

    await page.getByTestId('create').click()
    await submitTitleForm(page, title)
    await row(page, title).waitFor()

    expect(await row(page, title).count()).toBe(1)
  })

  it('opens the encounter from the listing', async () => {
    const page = await openPage('/encounters')

    await row(page, title).getByRole('link', { name: title }).click()
    await page.waitForURL(/\/encounters\/\d+-.+$/)

    expect(new URL(page.url()).pathname).toMatch(/^\/encounters\/\d+-/)
  })

  it('renames an encounter', async () => {
    const page = await openPage('/encounters')

    await row(page, title).getByRole('button', { name: 'Update' }).click()
    await submitTitleForm(page, updatedTitle)
    await row(page, updatedTitle).waitFor()

    expect(await row(page, title).count()).toBe(0)
  })

  it('copies an encounter', async () => {
    const page = await openPage('/encounters')

    await row(page, updatedTitle).getByRole('button', { name: 'Copy' }).click()
    await row(page, copyTitle).waitFor()

    expect(await row(page, copyTitle).count()).toBe(1)
  })

  it('deletes the encounter and its copy', async () => {
    const page = await openPage('/encounters')
    await row(page, copyTitle).waitFor()

    await row(page, updatedTitle).getByRole('checkbox').click()
    await row(page, copyTitle).getByRole('checkbox').click()
    await page.getByTestId('remove').click()
    await page.getByTestId('confirm-button').click()
    await row(page, copyTitle).waitFor({ state: 'detached' })

    expect(await row(page, updatedTitle).count()).toBe(0)
    expect(await row(page, copyTitle).count()).toBe(0)
  })
})
