import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Profile from '~/pages/profile.vue'
import { authUser } from '~~/test/fixtures/auth-user'

const { ask, navigateTo, removeProfile, toast, updateProfile, useSeo } =
  vi.hoisted(() => ({
    ask: vi.fn(),
    navigateTo: vi.fn(),
    removeProfile: vi.fn(),
    toast: vi.fn(),
    updateProfile: vi.fn(),
    useSeo: vi.fn(),
  }))

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}))

vi.mock('~~/queries/profiles', () => ({
  useProfileUpdate: () => ({ mutateAsync: updateProfile }),
  useProfileRemove: () => ({ mutateAsync: removeProfile }),
}))

vi.mock('~/components/atoms/AvatarPicker.vue', () => ({
  default: {
    name: 'AvatarPickerStub',
    props: {
      modelValue: { type: Object },
      profile: { type: Boolean },
      deprecatedAvatar: { type: Boolean },
    },
    emits: ['save'],
    template: '<div />',
  },
}))

const user = ref<AuthUser>({ ...authUser })

mockNuxtImport('useSeo', () => useSeo)
mockNuxtImport('useAuthenticatedUser', () => () => user)
mockNuxtImport('useConfirm', () => () => ({ ask }))
mockNuxtImport('navigateTo', () => navigateTo)
mockNuxtImport('useThrottleFn', () => (fn: unknown) => fn)

const DataFormStub = defineComponent({
  props: ['update', 'initialValues'],
  template: '<div />',
})

const PasswordFormStub = defineComponent({
  props: ['update'],
  template: '<div />',
})

const stubs = {
  FormProfileData: DataFormStub,
  FormProfilePassword: PasswordFormStub,
  NuxtLayout: { template: '<div><slot /></div>' },
}

type Update = (data: ProfileUpdate & { password?: string }) => Promise<void>

async function mountPage() {
  const component = await mountSuspended(Profile, { global: { stubs } })

  await flushPromises()

  return {
    component,
    avatarPicker: component.findComponent({ name: 'AvatarPickerStub' }),
    dataForm: component.findComponent(DataFormStub),
    get updateProfileData() {
      return component.findComponent(DataFormStub).props('update') as Update
    },
    get updatePassword() {
      return component.findComponent(PasswordFormStub).props('update') as Update
    },
    async removeUser() {
      await component.get('[data-test-delete]').trigger('click')
    },
  }
}

function confirmCallback(): (confirmed: boolean) => Promise<void> {
  return ask.mock.calls[0]![1]
}

describe('Profile page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    user.value = { ...authUser }

    updateProfile.mockResolvedValue(undefined)
    removeProfile.mockResolvedValue(undefined)
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Profile')
  })

  it('Should render the subscription type of the user', async () => {
    user.value = { ...authUser, subscriptionType: 'pro' }

    const { component } = await mountPage()

    expect(component.get('[data-test-subscription]').text()).toBe('pro')
  })

  it('Should seed the avatar picker with the avatar of the user', async () => {
    user.value = {
      ...authUser,
      avatar: 'https://example.com/avatar.svg',
      avatarOptions: { hair: 'long' },
    }

    const { avatarPicker } = await mountPage()

    expect(avatarPicker.props('modelValue')).toEqual({
      url: 'https://example.com/avatar.svg',
      extra: { hair: 'long' },
    })
    expect(avatarPicker.props('profile')).toBe(true)
    expect(avatarPicker.props('deprecatedAvatar')).toBe(false)
  })

  it('Should fall back to empty avatar values when the user has none', async () => {
    user.value = {
      ...authUser,
      avatar: null,
      avatarOptions: null,
    } as unknown as AuthUser

    const { avatarPicker } = await mountPage()

    expect(avatarPicker.props('modelValue')).toEqual({ url: '', extra: {} })
    expect(avatarPicker.props('deprecatedAvatar')).toBe(true)
  })

  it('Should pass the user data as initial values to the data form', async () => {
    const { dataForm } = await mountPage()

    expect(dataForm.props('initialValues')).toEqual({
      name: authUser.name,
      username: authUser.username,
      email: authUser.email,
      marketing: authUser.marketing,
    })
  })

  it('Should fall back to defaults for missing user data', async () => {
    user.value = {
      ...authUser,
      name: null,
      username: null,
      email: '',
      marketing: null,
    } as unknown as AuthUser

    const { dataForm } = await mountPage()

    expect(dataForm.props('initialValues')).toEqual({
      name: 'tester',
      username: '',
      email: '',
      marketing: true,
    })
  })

  it('Should update the profile when the avatar picker saves', async () => {
    const { avatarPicker } = await mountPage()

    avatarPicker.vm.$emit('save', {
      url: 'https://example.com/new.svg',
      extra: { hair: 'short' },
    })

    await nextTick()

    expect(updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        id: authUser.id,
        data: {
          avatar: 'https://example.com/new.svg',
          avatarOptions: { hair: 'short' },
        },
      }),
    )
  })

  it('Should update the profile with the data of the form', async () => {
    const { updateProfileData } = await mountPage()

    await updateProfileData({ name: 'Bilbo' })

    expect(updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ id: authUser.id, data: { name: 'Bilbo' } }),
    )
  })

  it('Should update the profile with the password of the form', async () => {
    const { updatePassword } = await mountPage()

    await updatePassword({ password: 'Secret1!' })

    expect(updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ data: { password: 'Secret1!' } }),
    )
  })

  it('Should show a success toast when the update succeeds', async () => {
    updateProfile.mockImplementation(async ({ onSuccess }) => onSuccess())

    const { updateProfileData } = await mountPage()

    await updateProfileData({ name: 'Bilbo' })

    expect(toast).toHaveBeenCalledWith({
      description: 'pages.profile.toast.success.text',
      variant: 'success',
    })
  })

  it('Should show an error toast and throw when the update fails', async () => {
    updateProfile.mockImplementation(async ({ onError }) => onError('Boom'))

    const { updateProfileData } = await mountPage()

    await expect(updateProfileData({ name: 'Bilbo' })).rejects.toThrow('Boom')

    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'Boom',
      variant: 'destructive',
    })
  })

  it('Should fall back to a generic error description when there is no message', async () => {
    updateProfile.mockImplementation(async ({ onError }) => onError(''))

    const { updateProfileData } = await mountPage()

    await expect(updateProfileData({ name: 'Bilbo' })).rejects.toThrow()

    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'general.error.text',
      variant: 'destructive',
    })
  })

  it('Should translate the reused password error', async () => {
    updateProfile.mockImplementation(async ({ onError }) =>
      onError('New password should be different from the old password.'),
    )

    const { updatePassword } = await mountPage()

    await expect(updatePassword({ password: 'Secret1!' })).rejects.toThrow(
      'pages.profile.password.same',
    )

    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'New password should be different from the old password.',
      variant: 'destructive',
    })
  })

  it('Should ask for confirmation before removing the user', async () => {
    const { removeUser } = await mountPage()

    await removeUser()

    expect(ask).toHaveBeenCalledWith(
      {
        title: 'pages.profile.dialog.delete.title',
        description: 'pages.profile.dialog.delete.text',
      },
      expect.any(Function),
    )
    expect(removeProfile).not.toHaveBeenCalled()
  })

  it('Should not remove the user when the confirmation is declined', async () => {
    const { removeUser } = await mountPage()

    await removeUser()
    await confirmCallback()(false)

    expect(removeProfile).not.toHaveBeenCalled()
  })

  it('Should remove the user when the confirmation is accepted', async () => {
    const { removeUser } = await mountPage()

    await removeUser()
    await confirmCallback()(true)

    expect(removeProfile).toHaveBeenCalledWith(
      expect.objectContaining({ id: authUser.id }),
    )
  })

  it('Should redirect home and toast when the removal succeeds', async () => {
    removeProfile.mockImplementation(async ({ onSuccess }) => onSuccess())

    const { removeUser } = await mountPage()

    await removeUser()
    await confirmCallback()(true)

    expect(navigateTo).toHaveBeenCalledWith('/')
    expect(toast).toHaveBeenCalledWith({
      description: 'pages.profile.toast.delete.text',
      variant: 'success',
    })
  })

  it('Should show an error toast when the removal fails', async () => {
    removeProfile.mockImplementation(async ({ onError }) => onError())

    const { removeUser } = await mountPage()

    await removeUser()
    await confirmCallback()(true)

    expect(navigateTo).not.toHaveBeenCalled()
    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'general.error.text',
      variant: 'destructive',
    })
  })
})
