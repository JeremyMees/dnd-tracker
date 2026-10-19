import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { DOMWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Resources from '~/components/initiative/Resources.vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const mockPatchRow = vi.fn()

const provide = {
  [INITIATIVE_SHEET]: { sheet: ref(undefined), patchRow: mockPatchRow },
}

const breath: DndAction = {
  name: 'Fire Breath',
  desc: '',
  attacks: [],
  actionType: 'action',
  usageLimits: { type: 'recharge', param: 5 },
}

const frighten: DndAction = {
  name: 'Frightful Presence',
  desc: '',
  attacks: [],
  actionType: 'action',
  usageLimits: { type: 'perDay', param: 3 },
}

const tail: DndAction = {
  name: 'Tail Attack',
  desc: '',
  attacks: [],
  actionType: 'legendaryAction',
}

const dragon: InitiativeSheetRow = {
  id: 'dragon',
  name: 'Dragon',
  index: 0,
  initiative: 15,
  type: 'monster',
  conditions: [],
  actions: [breath, frighten, tail],
  traits: [{ name: 'Legendary Resistance (3/Day)', desc: '' }],
}

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

async function mount(item: InitiativeSheetRow = dragon) {
  wrapper = await mountSuspended(Resources, {
    props: { item },
    global: { provide },
  })

  return wrapper
}

function pips(component: NonNullable<typeof wrapper>, testId: string) {
  return component.find(`[test-id="${testId}"]`).findAll('[test-id="pip"]')
}

describe('Initiative resources', () => {
  beforeEach(() => {
    mockPatchRow.mockClear()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should render nothing for a lair row', async () => {
    const component = await mount({ ...dragon, type: 'lair' })

    expect(component.find('[test-id="resources"]').exists()).toBe(false)
  })

  it('Should offer the reaction to a player without a statblock', async () => {
    const component = await mount({
      ...dragon,
      type: 'player',
      actions: undefined,
      traits: undefined,
    })

    expect(pips(component, 'reaction')).toHaveLength(1)
    expect(component.find('[test-id="legendary-actions"]').exists()).toBe(false)
  })

  it('Should only offer the reaction to a row without limited resources', async () => {
    const component = await mount({
      ...dragon,
      traits: [],
      actions: [{ ...tail, actionType: 'action', name: 'Bite' }],
    })

    expect(component.find('[test-id="reaction"]').exists()).toBe(true)
    expect(component.find('[test-id="legendary-actions"]').exists()).toBe(false)
    expect(component.find('[test-id="legendary-resistances"]').exists()).toBe(
      false,
    )
    expect(component.find('[test-id="action-uses"]').exists()).toBe(false)
  })

  it('Should show a pip per legendary action, resistance and use', async () => {
    const component = await mount()
    const actionUses = component.findAll('[test-id="action-uses"]')

    expect(pips(component, 'legendary-actions')).toHaveLength(3)
    expect(pips(component, 'legendary-resistances')).toHaveLength(3)
    expect(pips(component, 'reaction')).toHaveLength(1)
    expect(actionUses).toHaveLength(2)
    expect(actionUses[0]!.text()).toContain('Fire Breath')
    expect(actionUses[0]!.findAll('[test-id="pip"]')).toHaveLength(1)
    expect(actionUses[1]!.findAll('[test-id="pip"]')).toHaveLength(3)
  })

  it('Should fill the stored uses', async () => {
    const component = await mount({
      ...dragon,
      resources: { legendaryActions: 2, reaction: true },
    })

    expect(
      pips(component, 'legendary-actions').map((pip: DOMWrapper<Element>) =>
        pip.attributes('aria-pressed'),
      ),
    ).toEqual(['true', 'true', 'false'])
    expect(pips(component, 'reaction')[0]!.attributes('aria-pressed')).toBe(
      'true',
    )
  })

  it('Should spend a legendary action', async () => {
    const component = await mount({ ...dragon, resources: { reaction: true } })

    await pips(component, 'legendary-actions')[0]!.trigger('click')

    expect(mockPatchRow).toHaveBeenCalledWith('dragon', {
      resources: { reaction: true, legendaryActions: 1 },
    })
  })

  it('Should drop a legendary resistance count that goes back to zero', async () => {
    const component = await mount({
      ...dragon,
      resources: { legendaryResistances: 1 },
    })

    await pips(component, 'legendary-resistances')[0]!.trigger('click')

    expect(mockPatchRow).toHaveBeenCalledWith('dragon', {
      resources: { legendaryResistances: undefined },
    })
  })

  it('Should toggle the reaction', async () => {
    const component = await mount({ ...dragon, resources: { reaction: true } })

    await pips(component, 'reaction')[0]!.trigger('click')

    expect(mockPatchRow).toHaveBeenCalledWith('dragon', {
      resources: { reaction: undefined },
    })
  })

  it('Should spend an action use next to the others', async () => {
    const component = await mount({
      ...dragon,
      resources: { actions: { 'Fire Breath': 1 } },
    })

    await component
      .findAll('[test-id="action-uses"]')[1]!
      .findAll('[test-id="pip"]')[1]!
      .trigger('click')

    expect(mockPatchRow).toHaveBeenCalledWith('dragon', {
      resources: { actions: { 'Fire Breath': 1, 'Frightful Presence': 2 } },
    })
  })

  it('Should drop the action uses once the last one is given back', async () => {
    const component = await mount({
      ...dragon,
      resources: { actions: { 'Fire Breath': 1 } },
    })

    await component
      .find('[test-id="action-uses"]')
      .find('[test-id="pip"]')
      .trigger('click')

    expect(mockPatchRow).toHaveBeenCalledWith('dragon', {
      resources: { actions: undefined },
    })
  })

  it('Should hide the reset button while nothing is used', async () => {
    const component = await mount({ ...dragon, resources: { actions: {} } })

    expect(component.find('[test-id="reset-resources"]').exists()).toBe(false)
  })

  it('Should reset every use', async () => {
    const component = await mount({
      ...dragon,
      resources: { legendaryResistances: 2, actions: { 'Fire Breath': 1 } },
    })

    await component.find('[test-id="reset-resources"]').trigger('click')

    expect(mockPatchRow).toHaveBeenCalledWith('dragon', { resources: {} })
  })
})
