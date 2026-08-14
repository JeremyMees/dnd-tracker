import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HpUpdate from '~/components/form/HpUpdate.vue'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { submitForm } from '~~/test/nuxt/stubs/form'

const handleToasts = vi.fn()
const updateRow = vi.fn()

const item = sheet.rows[0]!

type HpAction = Extract<DndHpType, 'heal' | 'temp' | 'damage'>

const buttons: Record<HpAction, number> = { heal: 0, temp: 1, damage: 2 }

function mountHpUpdate({
  withSheet = true,
  row = item,
}: { withSheet?: boolean; row?: InitiativeSheetRow } = {}) {
  return mountSuspended(HpUpdate, {
    props: {
      sheet: withSheet ? sheet : undefined,
      item: row,
      handleToasts,
      updateRow,
    },
  })
}

async function submitAs(
  component: Awaited<ReturnType<typeof mountHpUpdate>>,
  type: HpAction,
  amount = 5,
) {
  const submits = component.findAll('button[type="submit"]')

  await component.get('input[name="amount"]').setValue(amount)
  await submits[buttons[type]!]!.trigger('click')
  await submitForm(component)
}

function updatedRow(): InitiativeSheetRow {
  return updateRow.mock.calls[0]![0]
}

describe('HpUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    updateRow.mockResolvedValue(undefined)
  })

  it('Should match snapshot', async () => {
    const component = await mountHpUpdate()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the dice roll input and the three actions', async () => {
    const component = await mountHpUpdate()

    expect(component.find('input[name="amount"]').exists()).toBeTruthy()
    expect(component.findAll('button[type="submit"]')).toHaveLength(3)
    expect(component.text()).toContain('actions.heal')
    expect(component.text()).toContain('actions.temp')
    expect(component.text()).toContain('actions.damage')
  })

  it('Should heal the row', async () => {
    const component = await mountHpUpdate()

    await submitAs(component, 'heal', 5)

    expect(updatedRow().hitPoints).toBe(item.hitPoints! + 5)
  })

  it('Should never heal above the maximum', async () => {
    const component = await mountHpUpdate()

    await submitAs(component, 'heal', 500)

    expect(updatedRow().hitPoints).toBe(item.maxHitPoints)
  })

  it('Should set temporary hit points', async () => {
    const component = await mountHpUpdate()

    await submitAs(component, 'temp', 8)

    expect(updatedRow().tempHitPoints).toBe(8)
  })

  it('Should take damage from the temporary hit points first', async () => {
    const component = await mountHpUpdate()

    await submitAs(component, 'damage', 3)

    expect(updatedRow().tempHitPoints).toBe(item.tempHitPoints! - 3)
    expect(updatedRow().hitPoints).toBe(item.hitPoints)
  })

  it('Should take the rest of the damage from the hit points', async () => {
    const component = await mountHpUpdate()

    await submitAs(component, 'damage', 8)

    expect(updatedRow().tempHitPoints).toBe(0)
    expect(updatedRow().hitPoints).toBe(item.hitPoints! - 3)
  })

  it('Should warn about concentration when a concentrating row takes damage', async () => {
    const component = await mountHpUpdate()

    await submitAs(component, 'damage', 3)

    expect(handleToasts).toHaveBeenCalledWith([
      expect.objectContaining({
        title: ['components.initiativeTable.concentration.title'],
        variant: 'info',
      }),
    ])
  })

  it('Should not warn about concentration when healing', async () => {
    const component = await mountHpUpdate()

    await submitAs(component, 'heal', 3)

    expect(handleToasts).toHaveBeenCalledWith([])
  })

  it('Should not update without a sheet', async () => {
    const component = await mountHpUpdate({ withSheet: false })

    await submitAs(component, 'heal')

    expect(updateRow).not.toHaveBeenCalled()
  })

  it('Should not update when the amount is invalid', async () => {
    const component = await mountHpUpdate()

    await submitAs(component, 'heal', 1001)

    expect(updateRow).not.toHaveBeenCalled()
  })

  it('Should show the error when updating fails', async () => {
    updateRow.mockRejectedValue(new Error('Update failed'))

    const component = await mountHpUpdate()

    await submitAs(component, 'heal')

    expect(component.text()).toContain('Update failed')
  })

  it('Should show a generic error when the failure has no message', async () => {
    updateRow.mockRejectedValue({})

    const component = await mountHpUpdate()

    await submitAs(component, 'heal')

    expect(component.text()).toContain('An error occurred while updating HP')
  })
})
