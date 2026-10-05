import { describe, expect, it } from 'vitest'
import { createPage, setup } from '@nuxt/test-utils/e2e'
import { host, storageState } from '../helpers'

describe('authenticated session', async () => {
  await setup({ host, browser: true })

  it('opens a protected page without being sent to login', async () => {
    const page = await createPage('/campaigns', { storageState })

    expect(new URL(page.url()).pathname).toBe('/campaigns')
  })

  it('redirects away from login when already signed in', async () => {
    const page = await createPage('/login', { storageState })
    await page.waitForURL(url => !url.pathname.endsWith('/login'))

    expect(new URL(page.url()).pathname).not.toBe('/login')
  })
})
