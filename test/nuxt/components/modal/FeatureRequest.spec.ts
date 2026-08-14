import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FeatureRequestModal from '~/components/modal/FeatureRequest.vue'
import { authUser } from '~~/test/fixtures/auth-user'
import { submitForm } from '~~/test/nuxt/stubs/form'

const { create, fetchMock } = vi.hoisted(() => ({
  create: vi.fn(),
  fetchMock: vi.fn(),
}))

vi.mock('~/queries/features', () => ({
  useFeatureCreate: () => ({ mutateAsync: create }),
}))

mockNuxtImport('$fetch', () => fetchMock)

const user = ref<AuthUser | null>({ ...authUser })

mockNuxtImport('useAuthentication', () => () => ({ user }))

function mountFeatureRequestModal() {
  return mountSuspended(FeatureRequestModal)
}

function createOptions() {
  return create.mock.calls[0]![0]
}

describe('Feature request modal', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    user.value = { ...authUser }
    create.mockResolvedValue(undefined)
    fetchMock.mockResolvedValue(undefined)
  })

  it('Should match snapshot', async () => {
    const component = await mountFeatureRequestModal()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the title and description fields with a submit button', async () => {
    const component = await mountFeatureRequestModal()

    expect(component.find('[test-id="title"]').exists()).toBe(true)
    expect(component.find('[test-id="text"]').exists()).toBe(true)
    expect(component.get('[test-id="submit"]').text()).toBe('actions.create')
  })

  it('Should create a feature request for the current user', async () => {
    const component = await mountFeatureRequestModal()

    await component.get('[test-id="title"]').setValue('Add dark mode')
    await component
      .get('[test-id="text"]')
      .setValue('Please add a dark mode toggle')
    await submitForm(component)

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          title: 'Add dark mode',
          text: 'Please add a dark mode toggle',
          createdBy: authUser.id,
          voted: { like: [authUser.id], dislike: [] },
        },
      }),
    )
  })

  it('Should send the feature email and close on success', async () => {
    const component = await mountFeatureRequestModal()

    await component.get('[test-id="title"]').setValue('Add dark mode')
    await component
      .get('[test-id="text"]')
      .setValue('Please add a dark mode toggle')
    await submitForm(component)

    await createOptions().onSuccess()

    expect(fetchMock).toHaveBeenCalledWith('/api/emails/feature-request', {
      method: 'POST',
      body: {
        title: 'Add dark mode',
        text: 'Please add a dark mode toggle',
        name: authUser.username,
        email: authUser.email,
      },
    })
    expect(component.emitted('close')).toBeTruthy()
  })

  it('Should not submit when the title is too short', async () => {
    const component = await mountFeatureRequestModal()

    await component.get('[test-id="title"]').setValue('ab')
    await component
      .get('[test-id="text"]')
      .setValue('Please add a dark mode toggle')
    await submitForm(component)

    expect(create).not.toHaveBeenCalled()
  })

  it('Should not submit when the description is too short', async () => {
    const component = await mountFeatureRequestModal()

    await component.get('[test-id="title"]').setValue('Add dark mode')
    await component.get('[test-id="text"]').setValue('too short')
    await submitForm(component)

    expect(create).not.toHaveBeenCalled()
  })

  it('Should show the error the mutation reports', async () => {
    const component = await mountFeatureRequestModal()

    await component.get('[test-id="title"]').setValue('Add dark mode')
    await component
      .get('[test-id="text"]')
      .setValue('Please add a dark mode toggle')
    await submitForm(component)

    createOptions().onError('Create failed')
    await nextTick()

    expect(component.get('[test-id="error"]').text()).toBe('Create failed')
  })
})
