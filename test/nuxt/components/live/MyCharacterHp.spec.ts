import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MyCharacterHp from '~/components/live/MyCharacterHp.vue'
import { submitForm } from '~~/test/nuxt/stubs/form'

const apply = vi.fn().mockResolvedValue(undefined)

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
  beforeEach(() => {
    vi.clearAllMocks()
  })

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

  it('heals up to the max hp', async () => {
    const component = await mountHp()

    await submitAs(component, 'heal', 5)

    expect(apply).toHaveBeenCalledWith(
      { type: 'hp', hpType: 'heal', amount: 5 },
      { hitPoints: 15 },
    )
  })

  it('never predicts healing above the max hp', async () => {
    const component = await mountHp()

    await submitAs(component, 'heal', 500)

    expect(apply).toHaveBeenCalledWith(
      { type: 'hp', hpType: 'heal', amount: 500 },
      { hitPoints: 20 },
    )
  })

  it('sets temporary hit points directly rather than adding to them', async () => {
    const component = await mountHp()

    await submitAs(component, 'temp', 8)

    expect(apply).toHaveBeenCalledWith(
      { type: 'hp', hpType: 'temp', amount: 8 },
      { tempHitPoints: 8 },
    )
  })

  it('takes damage from temporary hit points first', async () => {
    const component = await mountHp()

    await submitAs(component, 'damage', 1)

    expect(apply).toHaveBeenCalledWith(
      { type: 'hp', hpType: 'damage', amount: 1 },
      { tempHitPoints: 1 },
    )
  })

  it('takes the rest of the damage from hit points once temp is exhausted', async () => {
    const component = await mountHp()

    await submitAs(component, 'damage', 5)

    expect(apply).toHaveBeenCalledWith(
      { type: 'hp', hpType: 'damage', amount: 5 },
      { tempHitPoints: 0, hitPoints: 7 },
    )
  })

  it('treats a missing temporary hit points as zero when taking damage', async () => {
    const component = await mountHp({ tempHitPoints: undefined })

    await submitAs(component, 'damage', 5)

    expect(apply).toHaveBeenCalledWith(
      { type: 'hp', hpType: 'damage', amount: 5 },
      { tempHitPoints: 0, hitPoints: 5 },
    )
  })

  it('does not predict a heal when max hit points is not defined, matching the server no-op', async () => {
    const component = await mountHp({ maxHitPoints: undefined })

    await submitAs(component, 'heal', 5)

    expect(apply).toHaveBeenCalledWith(
      { type: 'hp', hpType: 'heal', amount: 5 },
      {},
    )
  })

  it('predicts nothing when hit points are not defined', async () => {
    const component = await mountHp({ hitPoints: undefined })

    await submitAs(component, 'heal', 5)

    expect(apply).toHaveBeenCalledWith(
      { type: 'hp', hpType: 'heal', amount: 5 },
      {},
    )
  })

  it('disables the actions while pending', async () => {
    const component = await mountHp({}, true)

    for (const button of component.findAll('button[type="submit"]')) {
      expect(button.attributes('disabled')).toBeDefined()
    }
  })
})
