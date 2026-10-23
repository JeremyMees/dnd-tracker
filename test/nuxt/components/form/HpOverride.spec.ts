import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HpOverride from '~/components/form/HpOverride.vue'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { submitForm } from '~~/test/nuxt/stubs/form'

const apply = vi.fn()

const overridden = sheet.rows[0]!
const plain = sheet.rows[1]!

function mountHpOverride({ item = plain }: { item?: InitiativeSheetRow } = {}) {
  return mountSuspended(HpOverride, { props: { item, apply } })
}

async function submitAmount(
  component: Awaited<ReturnType<typeof mountHpOverride>>,
  amount?: number,
) {
  if (amount !== undefined) {
    await component.get('input[name="amount"]').setValue(amount)
  }

  await component.get('button[type="submit"]').trigger('click')
  await submitForm(component)
}

describe('HpOverride', () => {
  beforeEach(() => {
    apply.mockReset()
    apply.mockResolvedValue(undefined)
  })

  it('Should match snapshot', async () => {
    const component = await mountHpOverride()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the override field with its help text', async () => {
    const component = await mountHpOverride()

    expect(component.find('input[name="amount"]').exists()).toBeTruthy()
    expect(component.text()).toContain('components.inputs.overrideFieldLabel')
    expect(component.text()).toContain('components.inputs.optionalFieldHelp')
  })

  it('Should start empty when the HP was never overridden', async () => {
    const component = await mountHpOverride()

    expect(
      component.get<HTMLInputElement>('input[name="amount"]').element.value,
    ).toBe('')
  })

  it('Should prefill the current max when the HP is already overridden', async () => {
    const component = await mountHpOverride({ item: overridden })

    expect(
      component.get<HTMLInputElement>('input[name="amount"]').element.value,
    ).toBe(overridden.maxHitPoints!.toString())
  })

  it('Should label the button as save when there is nothing to reset', async () => {
    const component = await mountHpOverride()

    expect(
      component.get('button[type="submit"]').attributes('aria-label'),
    ).toBe('actions.save')
  })

  it('Should label the button as reset when the HP is overridden', async () => {
    const component = await mountHpOverride({ item: overridden })

    expect(
      component.get('button[type="submit"]').attributes('aria-label'),
    ).toBe('actions.reset')
  })

  it('Should override the max HP with the given amount', async () => {
    const component = await mountHpOverride()

    await submitAmount(component, 150)

    expect(apply).toHaveBeenCalledWith({ type: 'override', amount: 150 })
  })

  it('Should reset to the old max when the row is already overridden', async () => {
    const component = await mountHpOverride({ item: overridden })

    await submitAmount(component)

    expect(apply).toHaveBeenCalledWith({
      type: 'override-reset',
      amount: overridden.maxHitPointsOld,
    })
  })

  it('Should reset when the given amount equals the old max', async () => {
    const component = await mountHpOverride({
      item: { ...plain, maxHitPointsOld: 50 },
    })

    await submitAmount(component, 50)

    expect(apply).toHaveBeenCalledWith({ type: 'override-reset', amount: 50 })
  })

  it('Should not update when the amount is invalid', async () => {
    const component = await mountHpOverride()

    await submitAmount(component, 1001)

    expect(apply).not.toHaveBeenCalled()
  })

  it('Should show the error when updating fails', async () => {
    apply.mockRejectedValue(new Error('Update failed'))

    const component = await mountHpOverride()

    await submitAmount(component, 150)

    expect(component.text()).toContain('Update failed')
  })

  it('Should show a generic error when the failure has no message', async () => {
    apply.mockRejectedValue({})

    const component = await mountHpOverride()

    await submitAmount(component, 150)

    expect(component.text()).toContain(
      'An error occurred while updating base HP',
    )
  })
})
