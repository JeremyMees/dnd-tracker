import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AcUpdateBase from '~/components/form/AcUpdateBase.vue'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { submitForm } from '~~/test/nuxt/stubs/form'

const handleAcChanges = vi.fn()
const updateRow = vi.fn()

const item = sheet.rows[0]!

function mountAcUpdateBase({ withSheet = true } = {}) {
  return mountSuspended(AcUpdateBase, {
    props: {
      sheet: withSheet ? sheet : undefined,
      item,
      handleAcChanges,
      updateRow,
    },
  })
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
    vi.clearAllMocks()

    updateRow.mockResolvedValue(undefined)
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

  it('Should set both the max and the current AC on submit', async () => {
    const component = await mountAcUpdateBase()

    await submitAmount(component, 21)

    expect(updateRow).toHaveBeenCalledWith({
      ...item,
      maxArmorClass: 21,
      maxArmorClassOld: undefined,
      armorClass: 21,
    })
  })

  it('Should clear a previous override when a new base is saved', async () => {
    const component = await mountAcUpdateBase()

    await submitAmount(component, 12)

    expect(updateRow.mock.calls[0]![0].maxArmorClassOld).toBeUndefined()
  })

  it('Should not update without a sheet', async () => {
    const component = await mountAcUpdateBase({ withSheet: false })

    await submitAmount(component, 21)

    expect(updateRow).not.toHaveBeenCalled()
  })

  it('Should not update when the amount is invalid', async () => {
    const component = await mountAcUpdateBase()

    await submitAmount(component, 1001)

    expect(updateRow).not.toHaveBeenCalled()
  })

  it('Should not update when the amount is missing', async () => {
    const component = await mountAcUpdateBase()

    await submitForm(component)

    expect(updateRow).not.toHaveBeenCalled()
  })

  it('Should show the error when updating fails', async () => {
    updateRow.mockRejectedValue(new Error('Update failed'))

    const component = await mountAcUpdateBase()

    await submitAmount(component, 21)

    expect(component.text()).toContain('Update failed')
  })

  it('Should show a generic error when the failure has no message', async () => {
    updateRow.mockRejectedValue({})

    const component = await mountAcUpdateBase()

    await submitAmount(component, 21)

    expect(component.text()).toContain(
      'An error occurred while updating base AC',
    )
  })
})
