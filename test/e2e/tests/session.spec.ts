import { describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { host, openPage } from '../utils'

describe('authenticated session', async () => {
  await setup({ host, browser: true })

  it('opens a protected page without being sent to login', async () => {
    const page = await openPage('/campaigns')

    expect(new URL(page.url()).pathname).toBe('/campaigns')
  })

  it('redirects away from login when already signed in', async () => {
    const page = await openPage('/login')
    await page.waitForURL(url => !url.pathname.endsWith('/login'))

    expect(new URL(page.url()).pathname).not.toBe('/login')
  })
})
