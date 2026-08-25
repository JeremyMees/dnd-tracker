import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import HistoryPanel from '~/components/initiative/HistoryPanel.vue'

const events = shallowRef<CombatEventRow[] | undefined>(undefined)
const isPending = ref(false)

vi.mock('~/queries/combat-events', () => ({
  useCombatEvents: () => ({ data: events, isPending }),
}))

interface EventOverrides {
  id?: number
  type: string
  round?: number
  payload?: Record<string, unknown>
}

function makeEvent(overrides: EventOverrides): CombatEventRow {
  return {
    id: overrides.id ?? 1,
    encounterId: 2,
    rowId: 'row-1',
    round: overrides.round ?? 3,
    createdBy: null,
    actorName: null,
    createdAt: '2026-08-25T00:00:00Z',
    payload: overrides.payload ?? {},
    type: overrides.type,
  } as CombatEventRow
}

describe('Initiative history panel', () => {
  it('Should show a loading skeleton while pending', async () => {
    isPending.value = true
    events.value = undefined

    const component = await mountSuspended(HistoryPanel, {
      props: { encounterId: 2 },
    })

    expect(component.findAll('[test-id="loading"]').length).toBe(5)

    isPending.value = false
  })

  it('Should show the empty state when there are no events', async () => {
    events.value = []

    const component = await mountSuspended(HistoryPanel, {
      props: { encounterId: 2 },
    })

    expect(component.find('[test-id="empty"]').exists()).toBeTruthy()
  })

  it('Should render one entry per event, most recent first as provided', async () => {
    events.value = [
      makeEvent({ id: 1, type: 'died', payload: { rowName: 'Elara' } }),
      makeEvent({ id: 2, type: 'stabilized', payload: { rowName: 'Bram' } }),
    ]

    const component = await mountSuspended(HistoryPanel, {
      props: { encounterId: 2 },
    })

    expect(component.findAll('[test-id="event"]').length).toBe(2)
  })

  it.each([
    ['heal', 'components.combatLog.hp.heal'],
    ['damage', 'components.combatLog.hp.damage'],
    ['temp', 'components.combatLog.hp.temp'],
    ['override', 'components.combatLog.hp.override'],
  ])('Should describe an hp event of kind %s', async (kind, key) => {
    events.value = [
      makeEvent({ type: 'hp', payload: { rowName: 'Elara', kind, amount: 5 } }),
    ]

    const component = await mountSuspended(HistoryPanel, {
      props: { encounterId: 2 },
    })

    expect(component.get('[test-id="event"]').text()).toContain(key)
  })

  it.each([
    ['add', 'components.combatLog.ac.add'],
    ['remove', 'components.combatLog.ac.remove'],
    ['temp', 'components.combatLog.ac.temp'],
    ['override', 'components.combatLog.ac.override'],
  ])('Should describe an ac event of kind %s', async (kind, key) => {
    events.value = [
      makeEvent({ type: 'ac', payload: { rowName: 'Bram', kind, amount: 2 } }),
    ]

    const component = await mountSuspended(HistoryPanel, {
      props: { encounterId: 2 },
    })

    expect(component.get('[test-id="event"]').text()).toContain(key)
  })

  it('Should describe a condition added event', async () => {
    events.value = [
      makeEvent({
        type: 'condition_added',
        payload: { rowName: 'Elara', condition: { id: 'p', name: 'Prone' } },
      }),
    ]

    const component = await mountSuspended(HistoryPanel, {
      props: { encounterId: 2 },
    })

    expect(component.get('[test-id="event"]').text()).toContain(
      'components.combatLog.conditionAdded',
    )
  })

  it('Should describe a condition removed event', async () => {
    events.value = [
      makeEvent({
        type: 'condition_removed',
        payload: { rowName: 'Elara', condition: { id: 'p', name: 'Prone' } },
      }),
    ]

    const component = await mountSuspended(HistoryPanel, {
      props: { encounterId: 2 },
    })

    expect(component.get('[test-id="event"]').text()).toContain(
      'components.combatLog.conditionRemoved',
    )
  })

  it('Should describe a broken concentration event', async () => {
    events.value = [
      makeEvent({
        type: 'concentration_broken',
        payload: { rowName: 'Elara' },
      }),
    ]

    const component = await mountSuspended(HistoryPanel, {
      props: { encounterId: 2 },
    })

    expect(component.get('[test-id="event"]').text()).toContain(
      'components.combatLog.concentrationBroken',
    )
  })

  it('Should describe a started concentration event', async () => {
    events.value = [
      makeEvent({
        type: 'concentration_started',
        payload: { rowName: 'Elara' },
      }),
    ]

    const component = await mountSuspended(HistoryPanel, {
      props: { encounterId: 2 },
    })

    expect(component.get('[test-id="event"]').text()).toContain(
      'components.combatLog.concentrationStarted',
    )
  })

  it.each([
    ['fail', 'components.combatLog.deathSave.fail'],
    ['save', 'components.combatLog.deathSave.save'],
  ])('Should describe a death save event of result %s', async (result, key) => {
    events.value = [
      makeEvent({
        type: 'death_save',
        payload: { rowName: 'Elara', result, amount: 1 },
      }),
    ]

    const component = await mountSuspended(HistoryPanel, {
      props: { encounterId: 2 },
    })

    expect(component.get('[test-id="event"]').text()).toContain(key)
  })

  it('Should describe a stabilized event', async () => {
    events.value = [
      makeEvent({ type: 'stabilized', payload: { rowName: 'Elara' } }),
    ]

    const component = await mountSuspended(HistoryPanel, {
      props: { encounterId: 2 },
    })

    expect(component.get('[test-id="event"]').text()).toContain(
      'components.combatLog.stabilized',
    )
  })

  it('Should describe a died event', async () => {
    events.value = [makeEvent({ type: 'died', payload: { rowName: 'Elara' } })]

    const component = await mountSuspended(HistoryPanel, {
      props: { encounterId: 2 },
    })

    expect(component.get('[test-id="event"]').text()).toContain(
      'components.combatLog.died',
    )
  })

  it('Should show the round label for each event', async () => {
    events.value = [
      makeEvent({ type: 'died', payload: { rowName: 'Elara' }, round: 4 }),
    ]

    const component = await mountSuspended(HistoryPanel, {
      props: { encounterId: 2 },
    })

    expect(component.get('[test-id="event"]').text()).toContain(
      'components.combatLog.round',
    )
  })
})
