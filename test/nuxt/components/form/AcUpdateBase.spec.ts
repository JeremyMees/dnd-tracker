import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AcUpdateBase from '~/components/form/AcUpdateBase.vue'
import { submitForm } from '~~/test/nuxt/stubs/form'

const apply = vi.fn()

function mountAcUpdateBase() {
  return mountSuspended(AcUpdateBase, { props: { apply } })
}

async function submitAmount(
  component: Awaited<ReturnType<typeof mountAcUpdateBase>>,
  amount: number,
) {
  await component.get('input[name="amount"]').setValue(amount)
  await submitForm(component)
}

describe('AcUpdateBase', () => {
  beforeEach(() => {
    apply.mockReset()
    apply.mockResolvedValue(undefined)
  })

  it('Should match snapshot', async () => {
    const component = await mountAcUpdateBase()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the base AC field with its help text', async () => {
    const component = await mountAcUpdateBase()

    expect(component.find('input[name="amount"]').exists()).toBeTruthy()
    expect(component.text()).toContain('components.inputs.baseFieldLabel')
    expect(component.text()).toContain('components.inputs.baseFieldHelp')
  })

  it('Should apply a new base on submit', async () => {
    const component = await mountAcUpdateBase()

    await submitAmount(component, 21)

    expect(apply).toHaveBeenCalledWith({ type: 'base', amount: 21 })
  })

  it('Should not apply when the amount is invalid', async () => {
    const component = await mountAcUpdateBase()

    await submitAmount(component, 1001)

    expect(apply).not.toHaveBeenCalled()
  })

  it('Should not apply when the amount is missing', async () => {
    const component = await mountAcUpdateBase()

    await submitForm(component)

    expect(apply).not.toHaveBeenCalled()
  })

  it('Should show the error when applying fails', async () => {
    apply.mockRejectedValue(new Error('Update failed'))

    const component = await mountAcUpdateBase()

    await submitAmount(component, 21)

    expect(component.text()).toContain('Update failed')
  })

  it('Should show a generic error when the failure has no message', async () => {
    apply.mockRejectedValue({})

    const component = await mountAcUpdateBase()

    await submitAmount(component, 21)

    expect(component.text()).toContain(
      'An error occurred while updating base AC',
    )
  })
})
