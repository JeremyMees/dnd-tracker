import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Register from '~/pages/(auth)/register.vue'
import { defaultAvatar } from '~~/constants/default-avatar'
import { fillForm, submitForm } from '~~/test/nuxt/stubs/form'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { navigateTo, register, toast, useSeo } = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  register: vi.fn(),
  toast: vi.fn(),
  useSeo: vi.fn(),
}))

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}))

vi.mock('~/components/atoms/AvatarPicker.vue', () => ({
  default: {
    name: 'AvatarPickerStub',
    props: { modelValue: { type: Object }, hideCreatorToggle: Boolean },
    emits: ['update:modelValue'],
    template: '<div data-test-avatar-picker />',
  },
}))

mockNuxtImport('useSeo', () => useSeo)
mockNuxtImport('navigateTo', () => navigateTo)
mockNuxtImport('useAuthentication', () => () => ({ register }))

const stubs = { NuxtLayout: nuxtLayoutStub }

const avatarPicker = { name: 'AvatarPickerStub' }

const account = {
  name: 'Bilbo Baggins',
  username: 'bilbo',
  email: 'bilbo@shire.com',
  password: 'Secret1!',
}

async function mountPage() {
  const component = await mountSuspended(Register, { global: { stubs } })

  await flushPromises()

  return {
    component,
    async fillAccount(values: Record<string, string> = account) {
      await fillForm(component, values)
      await component.get('[data-test-marketing]').trigger('click')
      await flushPromises()
    },
    async submit() {
      await submitForm(component)
    },
  }
}

describe('Register page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    register.mockResolvedValue(undefined)
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Register')
  })

  it('Should render inside the auth layout with the title', async () => {
    const { component } = await mountPage()

    expect(
      component.get('[data-test-layout]').attributes('data-test-layout'),
    ).toBe('auth')
    expect(component.get('[data-test-title]').text()).toBe(
      'pages.register.register',
    )
  })

  it('Should render the form fields and the submit button', async () => {
    const { component } = await mountPage()

    expect(component.find('[data-test-name]').exists()).toBe(true)
    expect(component.find('[data-test-username]').exists()).toBe(true)
    expect(component.find('[data-test-email]').exists()).toBe(true)
    expect(component.find('[data-test-password]').exists()).toBe(true)
    expect(component.find('[data-test-marketing]').exists()).toBe(true)
    expect(component.get('[data-test-submit]').text()).toBe(
      'pages.register.register',
    )
  })

  it('Should offer an avatar picker seeded with the default avatar', async () => {
    const { component } = await mountPage()

    const pickers = component.findAllComponents(avatarPicker)

    expect(pickers.length).toBeGreaterThan(0)
    expect(pickers[0]!.props('modelValue')).toEqual(defaultAvatar)
    expect(pickers[0]!.props('hideCreatorToggle')).toBe(true)
  })

  it('Should link to the login and forgot password pages', async () => {
    const { component } = await mountPage()

    expect(component.get('[data-test-login]').attributes('href')).toBe('/login')
    expect(component.get('[data-test-forgot]').attributes('href')).toBe(
      '/forgot-password',
    )
  })

  it('Should register the user with the form values and the avatar', async () => {
    const { fillAccount, submit } = await mountPage()

    await fillAccount()
    await submit()

    expect(register).toHaveBeenCalledWith({
      ...account,
      marketing: true,
      avatar: defaultAvatar.url,
      avatarOptions: defaultAvatar.extra,
    })
  })

  it('Should register the user with the avatar of the picker', async () => {
    const { component, fillAccount, submit } = await mountPage()

    const avatar = { url: 'https://example.com/avatar.svg', extra: { hair: 1 } }

    component.findComponent(avatarPicker).vm.$emit('update:modelValue', avatar)

    await fillAccount()
    await submit()

    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({
        avatar: avatar.url,
        avatarOptions: avatar.extra,
      }),
    )
  })

  it('Should toast and send the user to the login when registered', async () => {
    const { fillAccount, submit } = await mountPage()

    await fillAccount()
    await submit()

    expect(toast).toHaveBeenCalledWith({
      title: 'pages.register.toast.success.title',
      description: 'pages.register.toast.success.text',
      variant: 'success',
    })
    expect(navigateTo).toHaveBeenCalledWith('/login')
  })

  it('Should show the error and toast when registering fails', async () => {
    register.mockRejectedValue(new Error('Email already in use'))

    const { component, fillAccount, submit } = await mountPage()

    await fillAccount()
    await submit()

    expect(component.get('[data-test-error]').text()).toBe(
      'Email already in use',
    )
    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'general.error.text',
      variant: 'destructive',
    })
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('Should fall back to a generic error without a message', async () => {
    register.mockRejectedValue({})

    const { component, fillAccount, submit } = await mountPage()

    await fillAccount()
    await submit()

    expect(component.get('[data-test-error]').text()).toBe(
      'An error occurred during registration',
    )
  })

  it('Should not register without the required fields', async () => {
    const { submit } = await mountPage()

    await submit()

    expect(register).not.toHaveBeenCalled()
  })

  it('Should not register a name with numbers', async () => {
    const { component, fillAccount, submit } = await mountPage()

    await fillAccount({ ...account, name: 'Bilbo 123' })
    await submit()

    expect(register).not.toHaveBeenCalled()
    expect(component.text()).toContain('zod.alphaSpaces')
  })

  it('Should not register a too short username', async () => {
    const { fillAccount, submit } = await mountPage()

    await fillAccount({ ...account, username: 'bilb' })
    await submit()

    expect(register).not.toHaveBeenCalled()
  })

  it('Should not register an invalid email', async () => {
    const { fillAccount, submit } = await mountPage()

    await fillAccount({ ...account, email: 'not-an-email' })
    await submit()

    expect(register).not.toHaveBeenCalled()
  })

  it('Should not register a password without a symbol', async () => {
    const { component, fillAccount, submit } = await mountPage()

    await fillAccount({ ...account, password: 'Secret11' })
    await submit()

    expect(register).not.toHaveBeenCalled()
    expect(component.text()).toContain('zod.containsSymbol')
  })
})
