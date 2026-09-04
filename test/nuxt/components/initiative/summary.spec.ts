import {
  mockNuxtImport,
  mountSuspended,
  registerEndpoint,
} from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Summary from '~/components/initiative/Summary.vue'
import { clickInDialog, dialogText, inDialog } from '~~/test/nuxt/stubs/dialog'

const events = shallowRef<CombatEventRow[] | undefined>([])
const isPending = ref(false)
const liveActive = ref(false)

vi.mock('~/queries/combat-events', () => ({
  useCombatEvents: () => ({ data: events, isPending }),
}))

const { useLiveSessionMock } = vi.hoisted(() => ({
  useLiveSessionMock: vi.fn(),
}))

mockNuxtImport('useLiveSession', () => useLiveSessionMock)

const shareCalls: unknown[] = []

registerEndpoint('/api/encounter/live/summary', {
  method: 'POST',
  handler: () => {
    shareCalls.push(true)

    return { shared: true }
  },
})

const rows: InitiativeSheetRow[] = [
  {
    id: 'row-1',
    index: 0,
    initiative: 12,
    name: 'Elara',
    type: 'player',
    conditions: [],
    hitPoints: 4,
    maxHitPoints: 20,
  },
]

function makeEvent(payload: Record<string, unknown>): CombatEventRow {
  return {
    id: 1,
    encounterId: 2,
    rowId: 'row-1',
    round: 3,
    createdBy: null,
    actorName: null,
    createdAt: '2026-09-04T00:00:00Z',
    type: 'hp',
    payload,
  } as CombatEventRow
}

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

async function mount(open = true) {
  wrapper = await mountSuspended(Summary, {
    props: { encounterId: 2, rows, rounds: 4, open },
  })

  return wrapper
}

describe('Initiative summary', () => {
  beforeEach(() => {
    events.value = [
      makeEvent({
        rowName: 'Elara',
        kind: 'damage',
        amount: 16,
        before: 20,
        after: 4,
      }),
    ]
    isPending.value = false
    liveActive.value = false
    shareCalls.length = 0
    useLiveSessionMock.mockReturnValue({ active: liveActive })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should show a loading skeleton while the events are pending', async () => {
    isPending.value = true
    events.value = undefined

    await mount()

    expect(inDialog('loading')).not.toBeNull()
  })

  it('Should show the empty state when nothing was logged', async () => {
    events.value = []

    await mount()

    expect(inDialog('empty')).not.toBeNull()
    expect(inDialog('totals')).toBeNull()
  })

  it('Should render the stats once there are events', async () => {
    await mount()

    expect(inDialog('totals')).not.toBeNull()
    expect(inDialog('award')).not.toBeNull()
  })

  it('Should pass the round count through to the totals', async () => {
    await mount()

    await vi.waitFor(() => expect(dialogText('totals')).toContain('4'))
  })

  it('Should hide the share button when no live session is running', async () => {
    await mount()

    expect(inDialog('share')).toBeNull()
  })

  it('Should show the share button when a live session is running', async () => {
    liveActive.value = true

    await mount()

    expect(inDialog('share')).not.toBeNull()
  })

  it('Should disable sharing when there is nothing to share', async () => {
    liveActive.value = true
    events.value = []

    await mount()

    expect(inDialog('share')?.hasAttribute('disabled')).toBe(true)
  })

  it('Should post to the share endpoint and confirm afterwards', async () => {
    liveActive.value = true

    await mount()
    await clickInDialog('share')

    await vi.waitFor(() => {
      expect(shareCalls.length).toBe(1)
      expect(dialogText('share')).toContain(
        'components.combatSummary.actions.shared',
      )
    })
  })

  it('Should emit a hard reset when reset is pressed', async () => {
    const component = await mount()

    await clickInDialog('reset')

    expect(component.emitted('reset')).toEqual([[true]])
  })

  it('Should emit keepPlaying when the player carries on', async () => {
    const component = await mount()

    await clickInDialog('keep-playing')

    expect(component.emitted('keepPlaying')).toHaveLength(1)
  })
})
