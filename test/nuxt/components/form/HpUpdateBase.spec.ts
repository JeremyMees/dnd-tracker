import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HpUpdateBase from '~/components/form/HpUpdateBase.vue'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { submitForm } from '~~/test/nuxt/stubs/form'

const handleToasts = vi.fn()
const updateRow = vi.fn()

const item = sheet.rows[0]!

function mountHpUpdateBase({ withSheet = true } = {}) {
  return mountSuspended(HpUpdateBase, {
    props: {
      sheet: withSheet ? sheet : undefined,
      item,
      handleToasts,
      updateRow,
    },
  })
}

async function submitAmount(
  component: Awaited<ReturnType<typeof mountHpUpdateBase>>,
  amount: number,
) {
  await component.get('input[name="amount"]').setValue(amount)
  await submitForm(component)
}

describe('HpUpdateBase', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    updateRow.mockResolvedValue(undefined)
  })

  it('Should match snapshot', async () => {
    const component = await mountHpUpdateBase()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the base HP field with its help text', async () => {
    const component = await mountHpUpdateBase()

    expect(component.find('input[name="amount"]').exists()).toBeTruthy()
    expect(component.text()).toContain('components.inputs.baseFieldLabel')
    expect(component.text()).toContain('components.inputs.baseFieldHelp')
  })

  it('Should set both the max and the current HP on submit', async () => {
    const component = await mountHpUpdateBase()

    await submitAmount(component, 120)

    expect(updateRow).toHaveBeenCalledWith({
      ...item,
      maxHitPoints: 120,
      maxHitPointsOld: undefined,
      hitPoints: 120,
    })
  })

  it('Should not toast when only the base is changed', async () => {
    const component = await mountHpUpdateBase()

    await submitAmount(component, 120)

    expect(handleToasts).not.toHaveBeenCalled()
  })

  it('Should not update without a sheet', async () => {
    const component = await mountHpUpdateBase({ withSheet: false })

    await submitAmount(component, 120)

    expect(updateRow).not.toHaveBeenCalled()
  })

  it('Should not update when the amount is invalid', async () => {
    const component = await mountHpUpdateBase()

    await submitAmount(component, 1001)

    expect(updateRow).not.toHaveBeenCalled()
  })

  it('Should not update when the amount is missing', async () => {
    const component = await mountHpUpdateBase()

    await submitForm(component)

    expect(updateRow).not.toHaveBeenCalled()
  })

  it('Should show the error when updating fails', async () => {
    updateRow.mockRejectedValue(new Error('Update failed'))

    const component = await mountHpUpdateBase()

    await submitAmount(component, 120)

    expect(component.text()).toContain('Update failed')
  })

  it('Should show a generic error when the failure has no message', async () => {
    updateRow.mockRejectedValue({})

    const component = await mountHpUpdateBase()

    await submitAmount(component, 120)

    expect(component.text()).toContain(
      'An error occurred while updating base HP',
    )
  })
})
