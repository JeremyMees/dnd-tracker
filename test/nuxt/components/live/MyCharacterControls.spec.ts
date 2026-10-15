import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MyCharacterAc from '~/components/live/MyCharacterAc.vue'
import MyCharacterControls from '~/components/live/MyCharacterControls.vue'
import conditions from '~~/test/fixtures/conditions.json'
import { submitForm } from '~~/test/nuxt/stubs/form'

const row: PlayerRow = {
  id: 'row-1',
  index: 0,
  initiative: 12,
  name: 'Elara',
  type: 'player',
  conditions: [],
  hitPoints: 10,
  maxHitPoints: 20,
  armorClass: 14,
}

const goblin: PlayerRow = {
  id: 'row-2',
  index: 1,
  initiative: 8,
  name: 'Goblin',
  type: 'monster',
  conditions: [],
}

const apply = vi.fn().mockResolvedValue(undefined)
const endTurn = vi.fn().mockResolvedValue(undefined)
const pending = ref(false)

mockNuxtImport('useLiveMyAction', () => () => ({ apply, pending, endTurn }))

vi.mock('~/queries/srd', () => ({
  useConditionsListing: () => ({
    data: ref(conditions),
    isPending: ref(false),
  }),
  useSrdListing: () => ({ data: ref(undefined) }),
}))

const defaultAllow: LiveAllowActions = {
  hp: true,
  ac: true,
  deathSaves: true,
  concentration: true,
  conditions: true,
  endTurn: true,
}

function mountControls(
  overrides: Partial<PlayerRow> = {},
  active = true,
  allow: Partial<LiveAllowActions> = {},
) {
  return mountSuspended(MyCharacterControls, {
    props: {
      row: { ...row, ...overrides },
      rows: [row, goblin],
      active,
      allow: { ...defaultAllow, ...allow },
    },
  })
}

describe('LiveMyCharacterControls', () => {
  beforeEach(() => {
    pending.value = false
  })

  it('heals hp and applies the predicted optimistic patch', async () => {
    const component = await mountControls()

    await component.get('input[name="amount"]').setValue(5)
    await component.get('[test-id="heal"]').trigger('click')
    await submitForm(component)

    expect(apply).toHaveBeenCalledWith(
      { type: 'hp', hpType: 'heal', amount: 5 },
      { hitPoints: 15 },
    )
  })

  it('never predicts healing above the max hp', async () => {
    const component = await mountControls()

    await component.get('input[name="amount"]').setValue(500)
    await component.get('[test-id="heal"]').trigger('click')
    await submitForm(component)

    expect(apply).toHaveBeenCalledWith(
      { type: 'hp', hpType: 'heal', amount: 500 },
      { hitPoints: 20 },
    )
  })

  it('does not render the hp section when hit points are hidden', async () => {
    const component = await mountControls({ hitPoints: undefined })

    expect(component.find('[test-id="heal"]').exists()).toBe(false)
  })

  it('increases ac and applies the predicted optimistic patch', async () => {
    const component = await mountControls()
    const ac = component.getComponent(MyCharacterAc)

    await ac.get('input[name="amount"]').setValue(4)
    await ac.get('[test-id="add-ac"]').trigger('click')
    await submitForm(ac)

    expect(apply).toHaveBeenCalledWith(
      { type: 'ac', acType: 'add', amount: 4 },
      { armorClass: 18 },
    )
  })

  it('does not render the ac section when armor class is hidden', async () => {
    const component = await mountControls({ armorClass: undefined })

    expect(component.find('[test-id="add-ac"]').exists()).toBe(false)
  })

  it('does not render death saves when absent', async () => {
    const component = await mountControls()

    expect(component.find('[test-id="death-saves"]').exists()).toBe(false)
  })

  it('toggles a death save and applies the new value', async () => {
    const component = await mountControls({
      deathSaves: {
        save: [false, false, false],
        fail: [false, false, false],
      },
    })

    await component.get('[test-id="save"]').trigger('click')

    expect(apply).toHaveBeenCalledWith(
      {
        type: 'deathSaves',
        value: {
          save: [true, false, false],
          fail: [false, false, false],
        },
      },
      {
        deathSaves: {
          save: [true, false, false],
          fail: [false, false, false],
        },
      },
    )
  })

  it('toggles a death save failure and applies the new value', async () => {
    const component = await mountControls({
      deathSaves: {
        save: [false, false, false],
        fail: [false, false, false],
      },
    })

    await component.get('[test-id="fail"]').trigger('click')

    expect(apply).toHaveBeenCalledWith(
      {
        type: 'deathSaves',
        value: {
          save: [false, false, false],
          fail: [true, false, false],
        },
      },
      {
        deathSaves: {
          save: [false, false, false],
          fail: [true, false, false],
        },
      },
    )
  })

  it('shows the concentration indicator as active when concentrating', async () => {
    const component = await mountControls({ concentration: true })

    expect(
      component.get('[test-id="concentration"] .iconify').classes(),
    ).toContain('i-tabler:circle-filled')
  })

  it('toggles concentration', async () => {
    const component = await mountControls({ concentration: false })

    await component.get('[test-id="concentration"]').trigger('click')

    expect(apply).toHaveBeenCalledWith(
      { type: 'concentration', value: true },
      { concentration: true },
    )
  })

  it('passes the conditions, own row and visible rows to the picker', async () => {
    const component = await mountControls()

    expect(
      component.findComponent({ name: 'ConditionPicker' }).props(),
    ).toMatchObject({
      conditions,
      applied: [],
      item: row,
      rows: [row, goblin],
      activeRowId: row.id,
      disabled: false,
    })
  })

  it('adds a picked condition with its duration', async () => {
    const blinded = {
      ...conditions[0]!,
      duration: { rowId: row.id, timing: 'end', rounds: 2 },
    }

    const component = await mountControls()

    await component
      .findComponent({ name: 'ConditionPicker' })
      .vm.$emit('add', blinded)

    expect(apply).toHaveBeenCalledWith(
      { type: 'conditions', value: [blinded] },
      { conditions: [blinded] },
    )
  })

  it('removes a condition the picker removes', async () => {
    const blinded = conditions[0]!

    const component = await mountControls({ conditions: [blinded] })

    await component
      .findComponent({ name: 'ConditionPicker' })
      .vm.$emit('remove', blinded)

    expect(apply).toHaveBeenCalledWith(
      { type: 'conditions', value: [] },
      { conditions: [] },
    )
  })

  it('does not render an initiative editor', async () => {
    const component = await mountControls()

    expect(component.find('input[name="initiative"]').exists()).toBe(false)
  })

  it("disables death saves, concentration and conditions when it is not the row's turn", async () => {
    const component = await mountControls(
      {
        deathSaves: {
          save: [false, false, false],
          fail: [false, false, false],
        },
      },
      false,
    )

    expect(
      component.get('[test-id="save"]').attributes('disabled'),
    ).toBeDefined()
    expect(
      component.get('[test-id="concentration"]').attributes('disabled'),
    ).toBeDefined()

    expect(
      component.findComponent({ name: 'ConditionPicker' }).props('disabled'),
    ).toBe(true)
  })

  it("disables hp and ac actions when it is not the row's turn", async () => {
    const component = await mountControls({}, false)

    for (const button of component.findAll('button[type="submit"]')) {
      expect(button.attributes('disabled')).toBeDefined()
    }
  })

  it('disables hp actions when the DM has disallowed them', async () => {
    const component = await mountControls({}, true, { hp: false })

    expect(
      component.get('[test-id="heal"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('disables ac actions when the DM has disallowed them', async () => {
    const component = await mountControls({}, true, { ac: false })
    const ac = component.getComponent(MyCharacterAc)

    expect(ac.get('[test-id="add-ac"]').attributes('disabled')).toBeDefined()
  })

  it('disables death saves when the DM has disallowed them', async () => {
    const component = await mountControls(
      {
        deathSaves: {
          save: [false, false, false],
          fail: [false, false, false],
        },
      },
      true,
      { deathSaves: false },
    )

    expect(
      component.get('[test-id="save"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('disables concentration when the DM has disallowed it', async () => {
    const component = await mountControls({}, true, { concentration: false })

    expect(
      component.get('[test-id="concentration"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('disables conditions when the DM has disallowed them', async () => {
    const component = await mountControls({}, true, { conditions: false })
    const picker = component.findComponent({ name: 'ConditionPicker' })

    expect(picker.props('disabled')).toBe(true)

    await picker.vm.$emit('add', conditions[0])

    expect(apply).not.toHaveBeenCalled()
  })

  it('ends the turn when the end turn button is clicked', async () => {
    const component = await mountControls()

    await component.get('[test-id="end-turn"]').trigger('click')

    expect(endTurn).toHaveBeenCalled()
  })

  it("disables the end turn button when it is not the row's turn", async () => {
    const component = await mountControls({}, false)

    expect(
      component.get('[test-id="end-turn"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('disables the end turn button when the DM has disallowed it', async () => {
    const component = await mountControls({}, true, { endTurn: false })

    expect(
      component.get('[test-id="end-turn"]').attributes('disabled'),
    ).toBeDefined()
  })
})
