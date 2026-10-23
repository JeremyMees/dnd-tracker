import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import MyCharacterHp from '~/components/live/MyCharacterHp.vue'
import { submitForm } from '~~/test/nuxt/stubs/form'

const apply = vi.fn().mockResolvedValue(true)

const row: PlayerRow = {
  id: 'row-1',
  index: 0,
  initiative: 12,
  name: 'Elara',
  type: 'player',
  conditions: [],
  hitPoints: 10,
  maxHitPoints: 20,
  tempHitPoints: 2,
}

type HpAction = 'heal' | 'temp' | 'damage'

const buttons: Record<HpAction, number> = { heal: 0, temp: 1, damage: 2 }

function mountHp(overrides: Partial<PlayerRow> = {}, pending = false) {
  return mountSuspended(MyCharacterHp, {
    props: { row: { ...row, ...overrides }, pending, apply },
  })
}

async function submitAs(
  component: Awaited<ReturnType<typeof mountHp>>,
  type: HpAction,
  amount = 5,
) {
  const submits = component.findAll('button[type="submit"]')

  await component.get('input[name="amount"]').setValue(amount)
  await submits[buttons[type]!]!.trigger('click')
  await submitForm(component)
}

describe('LiveMyCharacterHp', () => {
  it('matches the snapshot', async () => {
    const component = await mountHp()

    expect(component.html()).toMatchSnapshot()
  })

  it('renders the dice roll input and the three actions', async () => {
    const component = await mountHp()

    expect(component.find('input[name="amount"]').exists()).toBeTruthy()
    expect(component.findAll('button[type="submit"]')).toHaveLength(3)
    expect(component.text()).toContain('actions.heal')
    expect(component.text()).toContain('actions.temp')
    expect(component.text()).toContain('actions.damage')
  })

  it.each(['heal', 'temp', 'damage'] as const)(
    'sends a %s action with the amount',
    async type => {
      const component = await mountHp()

      await submitAs(component, type, 7)

      expect(apply).toHaveBeenCalledWith({
        type: 'hp',
        hpType: type,
        amount: 7,
      })
    },
  )

  it('clears the amount once the action is applied', async () => {
    const component = await mountHp()

    await submitAs(component, 'heal', 5)

    expect(
      (component.get('input[name="amount"]').element as HTMLInputElement).value,
    ).toBe('')
  })

  it('keeps the amount when the action could not be applied', async () => {
    apply.mockResolvedValueOnce(false)

    const component = await mountHp()

    await submitAs(component, 'heal', 5)

    expect(
      (component.get('input[name="amount"]').element as HTMLInputElement).value,
    ).toBe('5')
  })

  it('disables the actions while pending', async () => {
    const component = await mountHp({}, true)

    for (const button of component.findAll('button[type="submit"]')) {
      expect(button.attributes('disabled')).toBeDefined()
    }
  })
})
