import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HpUpdate from '~/components/form/HpUpdate.vue'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { settle, submitForm } from '~~/test/nuxt/stubs/form'

const handleToasts = vi.fn()
const updateRow = vi.fn()

const item = sheet.rows[0]!

type HpAction = Extract<DndHpType, 'heal' | 'temp' | 'damage'>

const buttons: Record<HpAction, number> = { heal: 0, temp: 1, damage: 2 }

function mountHpUpdate({
  withSheet = true,
  row = item,
  intent,
}: {
  withSheet?: boolean
  row?: InitiativeSheetRow
  intent?: DndHpType
} = {}) {
  return mountSuspended(HpUpdate, {
    props: {
      sheet: withSheet ? sheet : undefined,
      item: row,
      handleToasts,
      updateRow,
      intent,
    },
  })
}

async function pressEnter(
  component: Awaited<ReturnType<typeof mountHpUpdate>>,
  amount = 5,
) {
  const input = component.get('input[name="amount"]')

  await input.setValue(amount)
  await input.trigger('keydown', { key: 'Enter' })
  await settle()
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

async function setDamageType(
  component: Awaited<ReturnType<typeof mountHpUpdate>>,
  type: DndDamageType,
) {
  component
    .findComponent({ name: 'SelectRoot' })
    .vm.$emit('update:modelValue', type)
  await flushPromises()
}

const defended: InitiativeSheetRow = {
  ...item,
  hitPoints: 50,
  tempHitPoints: 0,
  concentration: false,
  resistancesAndImmunities: {
    damageImmunities: ['poison'],
    damageResistances: ['fire'],
    damageVulnerabilities: ['cold'],
    conditionImmunities: [],
  },
}

function updatedRow(): InitiativeSheetRow {
  return updateRow.mock.calls[0]![0]
}

describe('HpUpdate', () => {
  beforeEach(() => {
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

  describe('Shortcut intent', () => {
    const row = {
      ...item,
      hitPoints: 20,
      maxHitPoints: 30,
      tempHitPoints: undefined,
    }

    it.each([
      ['damage', 15],
      ['heal', 25],
    ] as const)(
      'Should %s on enter when it was opened with that intent',
      async (intent, hitPoints) => {
        updateRow.mockClear()

        const component = await mountHpUpdate({ row, intent })

        await pressEnter(component)

        expect(updateRow).toHaveBeenCalledOnce()
        expect(updatedRow().hitPoints).toBe(hitPoints)

        component.unmount()
      },
    )

    it('Should highlight the button of the intent', async () => {
      const component = await mountHpUpdate({ row, intent: 'damage' })

      expect(component.get('[test-id="hp-damage"]').classes()).toContain(
        'ring-2',
      )
      expect(component.get('[test-id="hp-heal"]').classes()).not.toContain(
        'ring-2',
      )

      component.unmount()
    })

    it('Should leave enter alone without an intent', async () => {
      updateRow.mockClear()

      const component = await mountHpUpdate({ row })

      await pressEnter(component)

      expect(updateRow).not.toHaveBeenCalled()

      component.unmount()
    })
  })

  describe('Damage type', () => {
    let mounted: Awaited<ReturnType<typeof mountHpUpdate>> | undefined

    async function mountDefended() {
      mounted = await mountHpUpdate({ row: defended })

      return mounted
    }

    beforeEach(() => {
      updateRow.mockClear()
    })

    afterEach(() => {
      mounted?.unmount()
      mounted = undefined
    })

    it.each([
      ['fire', 45],
      ['cold', 30],
      ['poison', 50],
      ['acid', 40],
    ] as const)(
      'Should apply %s damage against the defenses',
      async (type, hp) => {
        const component = await mountDefended()

        await setDamageType(component, type)
        await submitAs(component, 'damage', 10)

        expect(updatedRow().hitPoints).toBe(hp)
      },
    )

    it('Should show the defense of the picked damage type', async () => {
      const component = await mountDefended()

      expect(component.find('[test-id="defense"]').exists()).toBe(false)

      await setDamageType(component, 'fire')

      expect(component.get('[test-id="defense"]').text()).toBe(
        'components.areaDamage.defense.resistant',
      )
    })

    it('Should ignore the damage type when healing', async () => {
      const component = await mountDefended()

      await setDamageType(component, 'fire')
      await submitAs(component, 'heal', 10)

      expect(updatedRow().hitPoints).toBe(60)
    })
  })
})
