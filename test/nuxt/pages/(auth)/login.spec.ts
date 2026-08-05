import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Login from '~/pages/(auth)/login.vue'
import { fillForm, submitForm } from '~~/test/nuxt/stubs/form'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { login, navigateTo, useSeo } = vi.hoisted(() => ({
  login: vi.fn(),
  navigateTo: vi.fn(),
  useSeo: vi.fn(),
}))

const redirect = ref<string>('')

mockNuxtImport('useSeo', () => useSeo)
mockNuxtImport('navigateTo', () => navigateTo)
mockNuxtImport('useAuthentication', () => () => ({ login }))
mockNuxtImport('useCookie', () => () => redirect)

const stubs = { NuxtLayout: nuxtLayoutStub, UiIconCloud: true }

const credentials = { email: 'bilbo@shire.com', password: 'Secret1!' }

async function mountPage() {
  const component = await mountSuspended(Login, { global: { stubs } })

  await flushPromises()

  return component
}

async function settleRedirect(): Promise<void> {
  await vi.advanceTimersByTimeAsync(100)
  await flushPromises()
}

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    redirect.value = ''
    login.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Log in')
  })

  it('Should render inside the auth layout with the title', async () => {
    const component = await mountPage()

    expect(
      component.get('[data-test-layout]').attributes('data-test-layout'),
    ).toBe('auth')
    expect(component.get('[data-test-title]').text()).toBe('pages.login.title')
  })

  it('Should render the form fields and the submit button', async () => {
    const component = await mountPage()

    expect(component.find('[data-test-email]').exists()).toBe(true)
    expect(component.find('[data-test-password]').exists()).toBe(true)
    expect(component.get('[data-test-submit]').text()).toBe(
      'pages.login.signIn',
    )
  })

  it('Should link to the register and forgot password pages', async () => {
    const component = await mountPage()

    expect(component.get('[data-test-register]').attributes('href')).toBe(
      '/register',
    )
    expect(component.get('[data-test-forgot]').attributes('href')).toBe(
      '/forgot-password',
    )
  })

  it('Should log the user in with the form values', async () => {
    const component = await mountPage()

    await fillForm(component, credentials)
    await submitForm(component)

    expect(login).toHaveBeenCalledWith(credentials)
  })

  it('Should send the user home after logging in', async () => {
    const component = await mountPage()

    await fillForm(component, credentials)
    await submitForm(component)
    await settleRedirect()

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('Should send the user to the redirect of the cookie', async () => {
    redirect.value = '/encounters'

    const component = await mountPage()

    await fillForm(component, credentials)
    await submitForm(component)
    await settleRedirect()

    expect(navigateTo).toHaveBeenCalledWith('/encounters')
    expect(redirect.value).toBe('')
  })

  it('Should show the error message when logging in fails', async () => {
    login.mockRejectedValue(new Error('Invalid credentials'))

    const component = await mountPage()

    await fillForm(component, credentials)
    await submitForm(component)

    expect(component.get('[data-test-error]').text()).toBe(
      'Invalid credentials',
    )
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('Should fall back to a generic error without a message', async () => {
    login.mockRejectedValue({})

    const component = await mountPage()

    await fillForm(component, credentials)
    await submitForm(component)

    expect(component.get('[data-test-error]').text()).toBe(
      'An error occurred during login',
    )
  })

  it('Should clear the previous error on the next attempt', async () => {
    login.mockRejectedValueOnce(new Error('Invalid credentials'))

    const component = await mountPage()

    await fillForm(component, credentials)
    await submitForm(component)

    expect(component.find('[data-test-error]').exists()).toBe(true)

    await submitForm(component)

    expect(component.find('[data-test-error]').exists()).toBe(false)
  })

  it('Should not log in without the required fields', async () => {
    const component = await mountPage()

    await submitForm(component)

    expect(login).not.toHaveBeenCalled()
  })

  it('Should not log in with an invalid email', async () => {
    const component = await mountPage()

    await fillForm(component, { ...credentials, email: 'not-an-email' })
    await submitForm(component)

    expect(login).not.toHaveBeenCalled()
  })

  it('Should not log in with a too short password', async () => {
    const component = await mountPage()

    await fillForm(component, { ...credentials, password: 'short' })
    await submitForm(component)

    expect(login).not.toHaveBeenCalled()
  })
})
