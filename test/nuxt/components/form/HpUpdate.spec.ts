import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HpUpdate from '~/components/form/HpUpdate.vue'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { settle, submitForm } from '~~/test/nuxt/stubs/form'

const apply = vi.fn()

const item = sheet.rows[0]!

type HpAction = Extract<DndHpType, 'heal' | 'temp' | 'damage'>

const buttons: Record<HpAction, number> = { heal: 0, temp: 1, damage: 2 }

function mountHpUpdate({
  row = item,
  intent,
}: { row?: InitiativeSheetRow; intent?: DndHpType } = {}) {
  return mountSuspended(HpUpdate, { props: { item: row, apply, intent } })
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

describe('HpUpdate', () => {
  beforeEach(() => {
    apply.mockReset()
    apply.mockResolvedValue(undefined)
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

  it.each(['heal', 'temp'] as const)('Should apply a %s change', async type => {
    const component = await mountHpUpdate()

    await submitAs(component, type, 8)

    expect(apply).toHaveBeenCalledWith({ type, amount: 8 })
  })

  it('Should apply untyped damage', async () => {
    const component = await mountHpUpdate()

    await submitAs(component, 'damage', 8)

    expect(apply).toHaveBeenCalledWith({
      type: 'damage',
      rolls: [{ amount: 8, type: undefined }],
    })
  })

  it('Should not apply when the amount is invalid', async () => {
    const component = await mountHpUpdate()

    await submitAs(component, 'heal', 1001)

    expect(apply).not.toHaveBeenCalled()
  })

  it('Should show the error when applying fails', async () => {
    apply.mockRejectedValue(new Error('Update failed'))

    const component = await mountHpUpdate()

    await submitAs(component, 'heal')

    expect(component.text()).toContain('Update failed')
  })

  it('Should show a generic error when the failure has no message', async () => {
    apply.mockRejectedValue({})

    const component = await mountHpUpdate()

    await submitAs(component, 'heal')

    expect(component.text()).toContain('An error occurred while updating HP')
  })

  describe('Shortcut intent', () => {
    it.each(['damage', 'heal'] as const)(
      'Should %s on enter when it was opened with that intent',
      async intent => {
        const component = await mountHpUpdate({ intent })

        await pressEnter(component)

        expect(apply).toHaveBeenCalledOnce()
        expect(apply.mock.calls[0]![0].type).toBe(intent)

        component.unmount()
      },
    )

    it('Should highlight the button of the intent', async () => {
      const component = await mountHpUpdate({ intent: 'damage' })

      expect(component.get('[test-id="hp-damage"]').classes()).toContain(
        'ring-2',
      )
      expect(component.get('[test-id="hp-heal"]').classes()).not.toContain(
        'ring-2',
      )

      component.unmount()
    })

    it('Should leave enter alone without an intent', async () => {
      const component = await mountHpUpdate()

      await pressEnter(component)

      expect(apply).not.toHaveBeenCalled()

      component.unmount()
    })
  })

  describe('Damage type', () => {
    const defended: InitiativeSheetRow = {
      ...item,
      resistancesAndImmunities: {
        damageImmunities: ['poison'],
        damageResistances: ['fire'],
        damageVulnerabilities: ['cold'],
        conditionImmunities: [],
      },
    }

    it('Should send the picked damage type with the damage', async () => {
      const component = await mountHpUpdate({ row: defended })

      await setDamageType(component, 'fire')
      await submitAs(component, 'damage', 10)

      expect(apply).toHaveBeenCalledWith({
        type: 'damage',
        rolls: [{ amount: 10, type: 'fire' }],
      })

      component.unmount()
    })

    it('Should show the defense of the picked damage type', async () => {
      const component = await mountHpUpdate({ row: defended })

      expect(component.find('[test-id="defense"]').exists()).toBe(false)

      await setDamageType(component, 'fire')

      expect(component.get('[test-id="defense"]').text()).toBe(
        'components.areaDamage.defense.resistant',
      )

      component.unmount()
    })

    it('Should ignore the damage type when healing', async () => {
      const component = await mountHpUpdate({ row: defended })

      await setDamageType(component, 'fire')
      await submitAs(component, 'heal', 10)

      expect(apply).toHaveBeenCalledWith({ type: 'heal', amount: 10 })

      component.unmount()
    })
  })
})
