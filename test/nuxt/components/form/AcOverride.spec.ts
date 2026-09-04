import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AcOverride from '~/components/form/AcOverride.vue'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { submitForm } from '~~/test/nuxt/stubs/form'

const handleAcChanges = vi.fn()
const updateRow = vi.fn()

const overridden = sheet.rows[0]!
const plain = sheet.rows[1]!
const updatedRow: Partial<InitiativeSheetRow> = { armorClass: 25 }

function mountAcOverride({
  withSheet = true,
  item = plain,
}: { withSheet?: boolean; item?: InitiativeSheetRow } = {}) {
  return mountSuspended(AcOverride, {
    props: {
      sheet: withSheet ? sheet : undefined,
      item,
      handleAcChanges,
      updateRow,
    },
  })
}

async function submitAmount(
  component: Awaited<ReturnType<typeof mountAcOverride>>,
  amount?: number,
) {
  if (amount !== undefined) {
    await component.get('input[name="amount"]').setValue(amount)
  }

  await component.get('button[type="submit"]').trigger('click')
  await submitForm(component)
}

describe('AcOverride', () => {
  beforeEach(() => {
    handleAcChanges.mockReturnValue(updatedRow)
    updateRow.mockResolvedValue(undefined)
  })

  it('Should match snapshot', async () => {
    const component = await mountAcOverride()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the override field with its help text', async () => {
    const component = await mountAcOverride()

    expect(component.find('input[name="amount"]').exists()).toBeTruthy()
    expect(component.text()).toContain('components.inputs.overrideFieldLabel')
    expect(component.text()).toContain('components.inputs.optionalFieldHelp')
  })

  it('Should start empty when the AC was never overridden', async () => {
    const component = await mountAcOverride()

    expect(
      component.get<HTMLInputElement>('input[name="amount"]').element.value,
    ).toBe('')
  })

  it('Should prefill the current max when the AC is already overridden', async () => {
    const component = await mountAcOverride({ item: overridden })

    expect(
      component.get<HTMLInputElement>('input[name="amount"]').element.value,
    ).toBe(overridden.maxArmorClass!.toString())
  })

  it('Should label the button as save when there is nothing to reset', async () => {
    const component = await mountAcOverride()

    expect(
      component.get('button[type="submit"]').attributes('aria-label'),
    ).toBe('actions.save')
  })

  it('Should label the button as reset when the AC is overridden', async () => {
    const component = await mountAcOverride({ item: overridden })

    expect(
      component.get('button[type="submit"]').attributes('aria-label'),
    ).toBe('actions.reset')
  })

  it('Should override the AC with the given amount', async () => {
    const component = await mountAcOverride()

    await submitAmount(component, 25)

    expect(handleAcChanges).toHaveBeenCalledWith(25, 'override')
    expect(updateRow).toHaveBeenCalledWith(updatedRow)
  })

  it('Should reset to the old max when the row is already overridden', async () => {
    const component = await mountAcOverride({ item: overridden })

    await submitAmount(component)

    expect(handleAcChanges).toHaveBeenCalledWith(
      overridden.maxArmorClassOld,
      'override-reset',
    )
  })

  it('Should reset when the given amount equals the old max', async () => {
    const component = await mountAcOverride({
      item: { ...plain, maxArmorClassOld: 12 },
    })

    await submitAmount(component, 12)

    expect(handleAcChanges).toHaveBeenCalledWith(12, 'override-reset')
  })

  it('Should not update without a sheet', async () => {
    const component = await mountAcOverride({ withSheet: false })

    await submitAmount(component, 25)

    expect(handleAcChanges).not.toHaveBeenCalled()
    expect(updateRow).not.toHaveBeenCalled()
  })

  it('Should not update when the amount is invalid', async () => {
    const component = await mountAcOverride()

    await submitAmount(component, 1001)

    expect(updateRow).not.toHaveBeenCalled()
  })

  it('Should show the error when updating fails', async () => {
    updateRow.mockRejectedValue(new Error('Update failed'))

    const component = await mountAcOverride()

    await submitAmount(component, 25)

    expect(component.text()).toContain('Update failed')
  })

  it('Should show a generic error when the failure has no message', async () => {
    updateRow.mockRejectedValue({})

    const component = await mountAcOverride()

    await submitAmount(component, 25)

    expect(component.text()).toContain(
      'An error occurred while updating base AC',
    )
  })
})
