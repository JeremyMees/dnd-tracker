import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProfilePassword from '~/components/form/ProfilePassword.vue'
import { submitForm } from '~~/test/nuxt/stubs/form'

const update = vi.fn()

function mountProfilePassword() {
  return mountSuspended(ProfilePassword, { props: { update } })
}

async function submitPassword(
  component: Awaited<ReturnType<typeof mountProfilePassword>>,
  password: string,
) {
  await component.get('input[name="password"]').setValue(password)
  await submitForm(component)
}

describe('ProfilePassword', () => {
  beforeEach(() => {
    update.mockResolvedValue(undefined)
  })

  it('Should match snapshot', async () => {
    const component = await mountProfilePassword()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the password toggle with a save button', async () => {
    const component = await mountProfilePassword()

    expect(component.get('input[name="password"]').attributes('type')).toBe(
      'password',
    )
    expect(component.get('button[type="submit"]').text()).toBe('actions.save')
  })

  it('Should update with a valid password', async () => {
    const component = await mountProfilePassword()

    await submitPassword(component, 'Secret1!')

    expect(update).toHaveBeenCalledWith({ password: 'Secret1!' })
  })

  it('Should not update when the password is too short', async () => {
    const component = await mountProfilePassword()

    await submitPassword(component, 'Sh1!')

    expect(update).not.toHaveBeenCalled()
  })

  it('Should not update without an uppercase character', async () => {
    const component = await mountProfilePassword()

    await submitPassword(component, 'secret1!')

    expect(update).not.toHaveBeenCalled()
    expect(component.text()).toContain('zod.containsUppercase')
  })

  it('Should not update without a lowercase character', async () => {
    const component = await mountProfilePassword()

    await submitPassword(component, 'SECRET1!')

    expect(update).not.toHaveBeenCalled()
    expect(component.text()).toContain('zod.containsLowercase')
  })

  it('Should not update with a disallowed character', async () => {
    const component = await mountProfilePassword()

    await submitPassword(component, 'Secret1!€')

    expect(update).not.toHaveBeenCalled()
    expect(component.text()).toContain('zod.allowedChars')
  })

  it('Should not update without a number', async () => {
    const component = await mountProfilePassword()

    await submitPassword(component, 'Secretss!')

    expect(update).not.toHaveBeenCalled()
    expect(component.text()).toContain('zod.containsNumber')
  })

  it('Should not update without a symbol', async () => {
    const component = await mountProfilePassword()

    await submitPassword(component, 'Secret11')

    expect(update).not.toHaveBeenCalled()
    expect(component.text()).toContain('zod.containsSymbol')
  })

  it('Should show the error when updating fails', async () => {
    update.mockRejectedValue(new Error('Update failed'))

    const component = await mountProfilePassword()

    await submitPassword(component, 'Secret1!')

    expect(component.text()).toContain('Update failed')
  })
})
