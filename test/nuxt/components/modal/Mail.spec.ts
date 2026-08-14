import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import MailModal from '~/components/modal/Mail.vue'
import { submitForm } from '~~/test/nuxt/stubs/form'

function mountMailModal(send: (addresses: string[]) => void = vi.fn()) {
  return mountSuspended(MailModal, { props: { send } })
}

describe('Mail modal', () => {
  it('Should match snapshot', async () => {
    const component = await mountMailModal()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should start with a single empty address', async () => {
    const component = await mountMailModal()

    const inputs = component.findAll('input')

    expect(inputs).toHaveLength(1)
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('')
  })

  it('Should send the filled in addresses and close', async () => {
    const send = vi.fn()
    const component = await mountMailModal(send)

    await component.get('input').setValue('bilbo@shire.com')
    await submitForm(component)

    expect(send).toHaveBeenCalledWith(['bilbo@shire.com'])
    expect(component.emitted('close')).toBeTruthy()
  })

  it('Should not submit when the address is invalid', async () => {
    const send = vi.fn()
    const component = await mountMailModal(send)

    await component.get('input').setValue('not-an-email')
    await submitForm(component)

    expect(send).not.toHaveBeenCalled()
  })

  it('Should send multiple addresses once more are added', async () => {
    const send = vi.fn()
    const component = await mountMailModal(send)

    await component.get('input').setValue('bilbo@shire.com')
    await component.get('[test-id="add"]').trigger('click')
    await component.findAll('input')[1]!.setValue('frodo@shire.com')
    await submitForm(component)

    expect(send).toHaveBeenCalledWith(['bilbo@shire.com', 'frodo@shire.com'])
  })

  it('Should show the error thrown by the send callback', async () => {
    const send = vi.fn(() => {
      throw new Error('Mail server exploded')
    })
    const component = await mountMailModal(send)

    await component.get('input').setValue('bilbo@shire.com')
    await submitForm(component)

    expect(component.get('[test-id="error"]').text()).toBe(
      'Mail server exploded',
    )
    expect(component.emitted('close')).toBeFalsy()
  })
})
