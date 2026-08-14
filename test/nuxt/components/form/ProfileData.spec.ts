import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProfileData from '~/components/form/ProfileData.vue'
import { submitForm } from '~~/test/nuxt/stubs/form'

const update = vi.fn()

const initialValues = {
  name: 'Bilbo Baggins',
  username: 'bilbo',
  email: 'bilbo@shire.com',
  marketing: false,
}

function mountProfileData(overrides: Partial<typeof initialValues> = {}) {
  return mountSuspended(ProfileData, {
    props: { update, initialValues: { ...initialValues, ...overrides } },
  })
}

describe('ProfileData', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    update.mockResolvedValue(undefined)
  })

  it('Should match snapshot', async () => {
    const component = await mountProfileData()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render every field with a save button', async () => {
    const component = await mountProfileData()
    const text = component.text()

    expect(text).toContain('components.inputs.fullNameLabel')
    expect(text).toContain('components.inputs.usernameLabel')
    expect(text).toContain('components.inputs.emailLabel')
    expect(text).toContain('components.inputs.marketingLabel')
    expect(component.get('button[type="submit"]').text()).toBe('actions.save')
  })

  it('Should prefill the form with the initial values', async () => {
    const component = await mountProfileData()

    expect(
      component.get<HTMLInputElement>('input[name="name"]').element.value,
    ).toBe(initialValues.name)
    expect(
      component.get<HTMLInputElement>('input[name="username"]').element.value,
    ).toBe(initialValues.username)
    expect(
      component.get<HTMLInputElement>('input[name="email"]').element.value,
    ).toBe(initialValues.email)
    expect(component.get('[role="switch"]').attributes('aria-checked')).toBe(
      'false',
    )
  })

  it('Should update with the current values', async () => {
    const component = await mountProfileData()

    await component.get('input[name="name"]').setValue('Frodo Baggins')
    await submitForm(component)

    expect(update).toHaveBeenCalledWith({
      ...initialValues,
      name: 'Frodo Baggins',
    })
  })

  it('Should update the marketing preference through the switch', async () => {
    const component = await mountProfileData()

    await component.get('[role="switch"]').trigger('click')
    await submitForm(component)

    expect(update).toHaveBeenCalledWith({ ...initialValues, marketing: true })
  })

  it('Should not update when a field is too short', async () => {
    const component = await mountProfileData()

    await component.get('input[name="name"]').setValue('ab')
    await submitForm(component)

    expect(update).not.toHaveBeenCalled()
  })

  it('Should not update when the name has invalid characters', async () => {
    const component = await mountProfileData()

    await component.get('input[name="name"]').setValue('Bilbo 123')
    await submitForm(component)

    expect(update).not.toHaveBeenCalled()
    expect(component.text()).toContain('zod.alphaSpaces')
  })

  it('Should not update when the email is invalid', async () => {
    const component = await mountProfileData()

    await component.get('input[name="email"]').setValue('not-an-email')
    await submitForm(component)

    expect(update).not.toHaveBeenCalled()
  })

  it('Should show the error when updating fails', async () => {
    update.mockRejectedValue(new Error('Update failed'))

    const component = await mountProfileData()

    await submitForm(component)

    expect(component.text()).toContain('Update failed')
  })
})
