import { describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { dismissConsent, host, openPage } from '../helpers'

describe('login page', async () => {
  await setup({ host, browser: true })

  it('renders the login form', async () => {
    const page = await openPage('/login', { signedIn: false })

    expect(await page.getByTestId('email').isVisible()).toBe(true)
    expect(await page.getByTestId('password').isVisible()).toBe(true)
    expect(await page.getByTestId('submit').isVisible()).toBe(true)
  })

  it('marks fields invalid when submitted empty', async () => {
    const page = await openPage('/login', { signedIn: false })
    await dismissConsent(page)

    await page.getByTestId('submit').click()

    const invalid = page.locator('[aria-invalid="true"]')
    await invalid.first().waitFor()

    expect(await invalid.count()).toBe(2)
    expect(new URL(page.url()).pathname).toBe('/login')
  })

  it('navigates to the register page', async () => {
    const page = await openPage('/login', { signedIn: false })
    await dismissConsent(page)

    await page.getByTestId('register').click()

    await page.waitForURL('**/register')
    const username = page.getByTestId('username')
    await username.waitFor()

    expect(new URL(page.url()).pathname).toBe('/register')
    expect(await username.isVisible()).toBe(true)
  })
})
