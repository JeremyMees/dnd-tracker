import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MyCharacterAc from '~/components/live/MyCharacterAc.vue'
import { submitForm } from '~~/test/nuxt/stubs/form'

const apply = vi.fn().mockResolvedValue(true)

const row: PlayerRow = {
  id: 'row-1',
  index: 0,
  initiative: 12,
  name: 'Elara',
  type: 'player',
  conditions: [],
  armorClass: 14,
  tempArmorClass: 3,
}

type AcAction = 'add' | 'temp' | 'remove'

const buttons: Record<AcAction, number> = { add: 0, temp: 1, remove: 2 }

function mountAc(overrides: Partial<PlayerRow> = {}, pending = false) {
  return mountSuspended(MyCharacterAc, {
    props: { row: { ...row, ...overrides }, pending, apply },
  })
}

async function submitAs(
  component: Awaited<ReturnType<typeof mountAc>>,
  type: AcAction,
  amount = 5,
) {
  const submits = component.findAll('button[type="submit"]')

  await component.get('input[name="amount"]').setValue(amount)
  await submits[buttons[type]!]!.trigger('click')
  await submitForm(component)
}

describe('LiveMyCharacterAc', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('matches the snapshot', async () => {
    const component = await mountAc()

    expect(component.html()).toMatchSnapshot()
  })

  it('renders the dice roll input and the three actions', async () => {
    const component = await mountAc()

    expect(component.find('input[name="amount"]').exists()).toBeTruthy()
    expect(component.findAll('button[type="submit"]')).toHaveLength(3)
    expect(component.text()).toContain('actions.increase')
    expect(component.text()).toContain('actions.temp')
    expect(component.text()).toContain('actions.decrease')
  })

  it('increases the armor class with no upper cap', async () => {
    const component = await mountAc()

    await submitAs(component, 'add', 4)

    expect(apply).toHaveBeenCalledWith(
      { type: 'ac', acType: 'add', amount: 4 },
      { armorClass: 18 },
    )
  })

  it('sets temporary armor class directly rather than adding to it', async () => {
    const component = await mountAc()

    await submitAs(component, 'temp', 6)

    expect(apply).toHaveBeenCalledWith(
      { type: 'ac', acType: 'temp', amount: 6 },
      { tempArmorClass: 6 },
    )
  })

  it('removes from temporary armor class first', async () => {
    const component = await mountAc()

    await submitAs(component, 'remove', 2)

    expect(apply).toHaveBeenCalledWith(
      { type: 'ac', acType: 'remove', amount: 2 },
      { tempArmorClass: 1 },
    )
  })

  it('takes the rest of the reduction from armor class once temp is exhausted', async () => {
    const component = await mountAc()

    await submitAs(component, 'remove', 5)

    expect(apply).toHaveBeenCalledWith(
      { type: 'ac', acType: 'remove', amount: 5 },
      { tempArmorClass: 0, armorClass: 12 },
    )
  })

  it('treats a missing temporary armor class as zero when removing', async () => {
    const component = await mountAc({ tempArmorClass: undefined })

    await submitAs(component, 'remove', 5)

    expect(apply).toHaveBeenCalledWith(
      { type: 'ac', acType: 'remove', amount: 5 },
      { tempArmorClass: 0, armorClass: 9 },
    )
  })

  it('predicts nothing when armor class is not defined', async () => {
    const component = await mountAc({ armorClass: undefined })

    await submitAs(component, 'add', 4)

    expect(apply).toHaveBeenCalledWith(
      { type: 'ac', acType: 'add', amount: 4 },
      {},
    )
  })

  it('clears the amount once the action is applied', async () => {
    const component = await mountAc()

    await submitAs(component, 'add', 4)

    expect(
      (component.get('input[name="amount"]').element as HTMLInputElement).value,
    ).toBe('')
  })

  it('keeps the amount when the action could not be applied', async () => {
    apply.mockResolvedValueOnce(false)

    const component = await mountAc()

    await submitAs(component, 'add', 4)

    expect(
      (component.get('input[name="amount"]').element as HTMLInputElement).value,
    ).toBe('4')
  })

  it('disables the actions while pending', async () => {
    const component = await mountAc({}, true)

    for (const button of component.findAll('button[type="submit"]')) {
      expect(button.attributes('disabled')).toBeDefined()
    }
  })
})
