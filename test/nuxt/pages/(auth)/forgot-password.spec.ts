import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ForgotPassword from '~/pages/(auth)/forgot-password.vue'
import { fillForm, submitForm } from '~~/test/nuxt/stubs/form'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { navigateTo, resetPasswordForEmail, toast, useSeo } = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  toast: vi.fn(),
  useSeo: vi.fn(),
}))

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}))

mockNuxtImport('useSeo', () => useSeo)
mockNuxtImport('navigateTo', () => navigateTo)
mockNuxtImport('useSupabaseClient', () => () => ({
  auth: { resetPasswordForEmail },
}))

const stubs = { NuxtLayout: nuxtLayoutStub, UiIconCloud: true }

const email = { email: 'bilbo@shire.com' }

async function mountPage() {
  const component = await mountSuspended(ForgotPassword, { global: { stubs } })

  await flushPromises()

  return component
}

describe('Forgot password page', () => {
  beforeEach(() => {
    resetPasswordForEmail.mockResolvedValue({ error: null })
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Forgot password')
  })

  it('Should render inside the auth layout with the title', async () => {
    const component = await mountPage()

    expect(component.get('[test-id]').attributes('test-id')).toBe('auth')
    expect(component.get('[test-id="title"]').text()).toBe(
      'pages.forgotPassword.title',
    )
  })

  it('Should render the email field and the submit button', async () => {
    const component = await mountPage()

    expect(component.find('[test-id="email"]').exists()).toBe(true)
    expect(component.get('[test-id="submit"]').text()).toBe(
      'pages.forgotPassword.reset',
    )
  })

  it('Should link to the register and forgot password pages', async () => {
    const component = await mountPage()

    expect(component.get('[test-id="register"]').attributes('href')).toBe(
      '/register',
    )
    expect(component.get('[test-id="forgot"]').attributes('href')).toBe(
      '/forgot-password',
    )
  })

  it('Should ask supabase for a reset mail back to the reset page', async () => {
    const component = await mountPage()

    await fillForm(component, email)
    await submitForm(component)

    expect(resetPasswordForEmail).toHaveBeenCalledWith(email.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  })

  it('Should toast and send the user to the login when the mail is sent', async () => {
    const component = await mountPage()

    await fillForm(component, email)
    await submitForm(component)

    expect(toast).toHaveBeenCalledWith({
      title: 'pages.forgotPassword.toast.success.title',
      description: 'pages.forgotPassword.toast.success.text',
      variant: 'success',
    })
    expect(navigateTo).toHaveBeenCalledWith('/login')
  })

  it('Should show the error and toast when supabase fails', async () => {
    resetPasswordForEmail.mockResolvedValue({
      error: new Error('Rate limit reached'),
    })

    const component = await mountPage()

    await fillForm(component, email)
    await submitForm(component)

    expect(component.get('[test-id="error"]').text()).toBe('Rate limit reached')
    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'general.error.text',
      variant: 'destructive',
    })
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('Should fall back to a generic error without a message', async () => {
    resetPasswordForEmail.mockRejectedValue({})

    const component = await mountPage()

    await fillForm(component, email)
    await submitForm(component)

    expect(component.get('[test-id="error"]').text()).toBe(
      'An error occurred during password reset',
    )
  })

  it('Should clear the previous error on the next attempt', async () => {
    resetPasswordForEmail.mockRejectedValueOnce(new Error('Rate limit reached'))

    const component = await mountPage()

    await fillForm(component, email)
    await submitForm(component)

    expect(component.find('[test-id="error"]').exists()).toBe(true)

    await submitForm(component)

    expect(component.find('[test-id="error"]').exists()).toBe(false)
  })

  it('Should not send a mail without an email', async () => {
    const component = await mountPage()

    await submitForm(component)

    expect(resetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('Should not send a mail to an invalid email', async () => {
    const component = await mountPage()

    await fillForm(component, { email: 'not-an-email' })
    await submitForm(component)

    expect(resetPasswordForEmail).not.toHaveBeenCalled()
  })
})
