import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ResetPassword from '~/pages/(auth)/reset-password.vue'
import { fillForm, submitForm } from '~~/test/nuxt/stubs/form'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { navigateTo, toast, updateUser, useSeo } = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  toast: vi.fn(),
  updateUser: vi.fn(),
  useSeo: vi.fn(),
}))

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}))

const query = ref<Record<string, string>>({})

mockNuxtImport('useSeo', () => useSeo)
mockNuxtImport('navigateTo', () => navigateTo)
mockNuxtImport('useRoute', () => () => ({
  path: '/reset-password',
  params: {},
  query: query.value,
}))
mockNuxtImport('useSupabaseClient', () => () => ({ auth: { updateUser } }))

const stubs = { NuxtLayout: nuxtLayoutStub, UiIconCloud: true }

const password = { password: 'Secret1!' }

async function mountPage() {
  const component = await mountSuspended(ResetPassword, { global: { stubs } })

  await flushPromises()

  return component
}

describe('Reset password page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    query.value = {}
    updateUser.mockResolvedValue({ error: null })
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Reset password')
  })

  it('Should render inside the auth layout with the title', async () => {
    const component = await mountPage()

    expect(
      component.get('[data-test-layout]').attributes('data-test-layout'),
    ).toBe('auth')
    expect(component.get('[data-test-title]').text()).toBe(
      'pages.resetPassword.title',
    )
  })

  it('Should render the password field, the submit button and a way out', async () => {
    const component = await mountPage()

    expect(component.find('[data-test-password]').exists()).toBe(true)
    expect(component.get('[data-test-submit]').text()).toBe(
      'pages.resetPassword.reset',
    )
    expect(component.get('[data-test-cancel]').attributes('href')).toBe('/')
  })

  it('Should send the user back when the link carries an error', async () => {
    query.value = { error: 'access_denied' }

    await mountPage()

    expect(navigateTo).toHaveBeenCalledWith('/forgot-password')
    expect(toast).toHaveBeenCalledWith({
      title: 'pages.resetPassword.toast.error.title',
      description: 'pages.resetPassword.toast.error.text',
      variant: 'destructive',
    })
  })

  it('Should stay on the page for a valid link', async () => {
    await mountPage()

    expect(navigateTo).not.toHaveBeenCalled()
    expect(toast).not.toHaveBeenCalled()
  })

  it('Should update the password of the user', async () => {
    const component = await mountPage()

    await fillForm(component, password)
    await submitForm(component)

    expect(updateUser).toHaveBeenCalledWith(password)
  })

  it('Should toast and send the user home when the password is updated', async () => {
    const component = await mountPage()

    await fillForm(component, password)
    await submitForm(component)

    expect(toast).toHaveBeenCalledWith({
      description: 'pages.resetPassword.toast.success.text',
      variant: 'success',
    })
    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('Should show the error and toast when supabase fails', async () => {
    updateUser.mockResolvedValue({ error: new Error('Same password') })

    const component = await mountPage()

    await fillForm(component, password)
    await submitForm(component)

    expect(component.get('[data-test-error]').text()).toBe('Same password')
    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'general.error.text',
      variant: 'destructive',
    })
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('Should fall back to a generic error without a message', async () => {
    updateUser.mockRejectedValue({})

    const component = await mountPage()

    await fillForm(component, password)
    await submitForm(component)

    expect(component.get('[data-test-error]').text()).toBe(
      'An error occurred during password reset',
    )
  })

  it('Should not update without a password', async () => {
    const component = await mountPage()

    await submitForm(component)

    expect(updateUser).not.toHaveBeenCalled()
  })

  it('Should not update a password that is too short', async () => {
    const component = await mountPage()

    await fillForm(component, { password: 'Ab1!' })
    await submitForm(component)

    expect(updateUser).not.toHaveBeenCalled()
  })

  it('Should not update a password without an uppercase letter', async () => {
    const component = await mountPage()

    await fillForm(component, { password: 'secret1!' })
    await submitForm(component)

    expect(updateUser).not.toHaveBeenCalled()
    expect(component.text()).toContain('zod.containsUppercase')
  })

  it('Should not update a password without a number', async () => {
    const component = await mountPage()

    await fillForm(component, { password: 'Secretive!' })
    await submitForm(component)

    expect(updateUser).not.toHaveBeenCalled()
    expect(component.text()).toContain('zod.containsNumber')
  })

  it('Should not update a password without a symbol', async () => {
    const component = await mountPage()

    await fillForm(component, { password: 'Secret11' })
    await submitForm(component)

    expect(updateUser).not.toHaveBeenCalled()
    expect(component.text()).toContain('zod.containsSymbol')
  })
})
