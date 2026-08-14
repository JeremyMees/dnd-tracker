import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HpOverride from '~/components/form/HpOverride.vue'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { submitForm } from '~~/test/nuxt/stubs/form'

const handleToasts = vi.fn()
const updateRow = vi.fn()

const overridden = sheet.rows[0]!
const plain = sheet.rows[1]!

function mountHpOverride({
  withSheet = true,
  item = plain,
}: { withSheet?: boolean; item?: InitiativeSheetRow } = {}) {
  return mountSuspended(HpOverride, {
    props: {
      sheet: withSheet ? sheet : undefined,
      item,
      handleToasts,
      updateRow,
    },
  })
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

function updatedRow(): InitiativeSheetRow {
  return updateRow.mock.calls[0]![0]
}

describe('HpOverride', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    updateRow.mockResolvedValue(undefined)
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

    expect(updatedRow().maxHitPoints).toBe(150)
    expect(updatedRow().maxHitPointsOld).toBe(plain.maxHitPoints)
  })

  it('Should reset to the old max when the row is already overridden', async () => {
    const component = await mountHpOverride({ item: overridden })

    await submitAmount(component)

    expect(updatedRow().maxHitPoints).toBe(overridden.maxHitPointsOld)
    expect(updatedRow().maxHitPointsOld).toBeUndefined()
  })

  it('Should reset when the given amount equals the old max', async () => {
    const component = await mountHpOverride({
      item: { ...plain, maxHitPointsOld: 50 },
    })

    await submitAmount(component, 50)

    expect(updatedRow().maxHitPoints).toBe(50)
    expect(updatedRow().maxHitPointsOld).toBeUndefined()
  })

  it('Should pass the toasts of the change on', async () => {
    const component = await mountHpOverride()

    await submitAmount(component, 150)

    expect(handleToasts).toHaveBeenCalledWith(expect.any(Array))
  })

  it('Should not update without a sheet', async () => {
    const component = await mountHpOverride({ withSheet: false })

    await submitAmount(component, 150)

    expect(updateRow).not.toHaveBeenCalled()
  })

  it('Should not update when the amount is invalid', async () => {
    const component = await mountHpOverride()

    await submitAmount(component, 1001)

    expect(updateRow).not.toHaveBeenCalled()
  })

  it('Should show the error when updating fails', async () => {
    updateRow.mockRejectedValue(new Error('Update failed'))

    const component = await mountHpOverride()

    await submitAmount(component, 150)

    expect(component.text()).toContain('Update failed')
  })
})
