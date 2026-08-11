import type { VueWrapper } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLiveRealtime } from '~/composables/useLiveRealtime'

const {
  getQueryData,
  invalidateQueries,
  on,
  removeChannel,
  setQueryData,
  subscribe,
  track,
  unsubscribe,
} = vi.hoisted(() => ({
  getQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
  on: vi.fn(),
  removeChannel: vi.fn(),
  setQueryData: vi.fn(),
  subscribe: vi.fn(),
  track: vi.fn(),
  unsubscribe: vi.fn(),
}))

const channel = { on, subscribe, unsubscribe, track }

vi.mock('@tanstack/vue-query', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useQueryClient: () => ({ getQueryData, setQueryData, invalidateQueries }),
}))

const isOnline = ref(true)
const visibility = ref<DocumentVisibilityState>('visible')

mockNuxtImport('useOnline', () => () => isOnline)
mockNuxtImport('useDocumentVisibility', () => () => visibility)
mockNuxtImport('useSupabaseClient', () => () => ({
  channel: () => channel,
  removeChannel,
}))

const token = ref<string>()
const uuid = ref<string>()
const seat = ref<string>()
const ownRow = ref<string | null>()

const Probe = defineComponent({
  setup() {
    useLiveRealtime(
      computed(() => token.value),
      computed(() => uuid.value),
      computed(() => seat.value),
      computed(() => ownRow.value),
    )

    return {}
  },
  template: '<div />',
})

let mounted: VueWrapper | undefined

async function mountProbe() {
  const component = await mountSuspended(Probe)

  await flushPromises()

  mounted = component

  return component
}

function emitBroadcast(event: string, payload: unknown): void {
  const call = on.mock.calls.find(
    call => call[0] === 'broadcast' && call[1].event === event,
  )
  const handler = call![2] as (arg: { payload: unknown }) => void

  handler({ payload })
}

describe('useLiveRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    on.mockReturnValue(channel)
    subscribe.mockReturnValue(channel)
    isOnline.value = true
    visibility.value = 'visible'
    token.value = 'session-token'
    uuid.value = 'session-uuid'
    seat.value = 'seat-1'
    ownRow.value = undefined
  })

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
    token.value = undefined
    uuid.value = undefined
    seat.value = undefined
    ownRow.value = undefined
  })

  it('subscribes to the session channel and tracks presence once subscribed', async () => {
    await mountProbe()

    expect(on).toHaveBeenCalledWith(
      'broadcast',
      { event: 'action' },
      expect.any(Function),
    )
    expect(on).toHaveBeenCalledWith(
      'broadcast',
      { event: 'sync' },
      expect.any(Function),
    )
    expect(subscribe).toHaveBeenCalledWith(expect.any(Function))

    const statusCallback = subscribe.mock.calls[0]![0] as (
      status: string,
    ) => void

    statusCallback('SUBSCRIBED')

    expect(track).toHaveBeenCalledWith({ seat: 'seat-1' })
  })

  it('does not track presence for a non-subscribed status', async () => {
    await mountProbe()

    const statusCallback = subscribe.mock.calls[0]![0] as (
      status: string,
    ) => void

    statusCallback('CHANNEL_ERROR')

    expect(track).not.toHaveBeenCalled()
  })

  it('does not subscribe until a uuid is available', async () => {
    uuid.value = undefined

    await mountProbe()

    expect(subscribe).not.toHaveBeenCalled()
  })

  it('resubscribes when the uuid changes', async () => {
    await mountProbe()

    expect(subscribe).toHaveBeenCalledTimes(1)

    uuid.value = 'other-uuid'
    await flushPromises()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
    expect(subscribe).toHaveBeenCalledTimes(2)
  })

  it('merges a sequential action broadcast into the cached row and bumps the version', async () => {
    const current = {
      sheet: {
        id: 1,
        title: 'Ambush',
        round: 1,
        activeIndex: 0,
        rows: [
          {
            id: 'row-1',
            index: 0,
            initiative: 10,
            name: 'Elara',
            type: 'player',
            conditions: [],
            hitPoints: 20,
          },
        ],
      },
      session: { code: 'ABC234', expiresAt: 'later', version: 3 },
    }

    getQueryData.mockReturnValue(current)

    await mountProbe()

    emitBroadcast('action', {
      version: 4,
      row: 'row-1',
      patch: { hitPoints: 15 },
    })

    expect(setQueryData).toHaveBeenCalledWith(
      ['useLiveState', 'session-token', 'seat-1'],
      {
        ...current,
        session: { ...current.session, version: 4 },
        sheet: {
          ...current.sheet,
          rows: [{ ...current.sheet.rows[0], hitPoints: 15 }],
        },
      },
    )
    expect(invalidateQueries).not.toHaveBeenCalled()
  })

  it('refetches instead of merging an action broadcast for the viewer own row', async () => {
    const current = {
      sheet: {
        id: 1,
        title: 'Ambush',
        round: 1,
        activeIndex: 0,
        rows: [
          {
            id: 'row-1',
            index: 0,
            initiative: 10,
            name: 'Elara',
            type: 'player',
            conditions: [],
            hitPoints: 20,
          },
        ],
      },
      session: { code: 'ABC234', expiresAt: 'later', version: 3 },
    }

    getQueryData.mockReturnValue(current)
    ownRow.value = 'row-1'

    await mountProbe()

    emitBroadcast('action', {
      version: 4,
      row: 'row-1',
      patch: { healthBand: 'bloodied' },
    })

    expect(setQueryData).not.toHaveBeenCalled()
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useLiveState', 'session-token', 'seat-1'],
    })
  })

  it('merges an action broadcast for a row other than the viewer own row', async () => {
    const current = {
      sheet: {
        id: 1,
        title: 'Ambush',
        round: 1,
        activeIndex: 0,
        rows: [
          {
            id: 'row-1',
            index: 0,
            initiative: 10,
            name: 'Elara',
            type: 'player',
            conditions: [],
            hitPoints: 20,
          },
        ],
      },
      session: { code: 'ABC234', expiresAt: 'later', version: 3 },
    }

    getQueryData.mockReturnValue(current)
    ownRow.value = 'row-2'

    await mountProbe()

    emitBroadcast('action', {
      version: 4,
      row: 'row-1',
      patch: { healthBand: 'bloodied' },
    })

    expect(invalidateQueries).not.toHaveBeenCalled()
    expect(setQueryData).toHaveBeenCalledWith(
      ['useLiveState', 'session-token', 'seat-1'],
      {
        ...current,
        session: { ...current.session, version: 4 },
        sheet: {
          ...current.sheet,
          rows: [{ ...current.sheet.rows[0], healthBand: 'bloodied' }],
        },
      },
    )
  })

  it('invalidates the query on a version gap instead of applying a stale patch', async () => {
    getQueryData.mockReturnValue({
      sheet: { id: 1, title: 't', round: 1, activeIndex: 0, rows: [] },
      session: { code: 'ABC234', expiresAt: 'later', version: 3 },
    })

    await mountProbe()

    emitBroadcast('action', { version: 6, row: 'row-1', patch: {} })

    expect(setQueryData).not.toHaveBeenCalled()
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useLiveState', 'session-token', 'seat-1'],
    })
  })

  it('ignores an already-applied or stale action broadcast', async () => {
    getQueryData.mockReturnValue({
      sheet: { id: 1, title: 't', round: 1, activeIndex: 0, rows: [] },
      session: { code: 'ABC234', expiresAt: 'later', version: 5 },
    })

    await mountProbe()

    emitBroadcast('action', { version: 5, row: 'row-1', patch: {} })

    expect(setQueryData).not.toHaveBeenCalled()
    expect(invalidateQueries).not.toHaveBeenCalled()
  })

  it('ignores an action broadcast when there is no cached state yet', async () => {
    getQueryData.mockReturnValue(undefined)

    await mountProbe()

    expect(() =>
      emitBroadcast('action', { version: 1, row: 'row-1', patch: {} }),
    ).not.toThrow()
    expect(setQueryData).not.toHaveBeenCalled()
    expect(invalidateQueries).not.toHaveBeenCalled()
  })

  it('replaces the full sheet on a newer sync broadcast', async () => {
    const oldState = {
      sheet: { id: 1, title: 'Old', round: 1, activeIndex: 0, rows: [] },
      session: { code: 'ABC234', expiresAt: 'later', version: 2 },
    }

    getQueryData.mockReturnValue(oldState)

    await mountProbe()

    const newSheet = { id: 1, title: 'New', round: 2, activeIndex: 1, rows: [] }

    emitBroadcast('sync', { version: 3, sheet: newSheet })

    expect(setQueryData).toHaveBeenCalledWith(
      ['useLiveState', 'session-token', 'seat-1'],
      expect.any(Function),
    )

    const updater = setQueryData.mock.calls[0]![1] as (old: unknown) => unknown

    expect(updater(oldState)).toEqual({
      sheet: newSheet,
      session: { code: 'ABC234', expiresAt: 'later', version: 3 },
    })
  })

  it('refetches instead of applying a sync broadcast when the viewer owns a row', async () => {
    const oldState = {
      sheet: { id: 1, title: 'Old', round: 1, activeIndex: 0, rows: [] },
      session: { code: 'ABC234', expiresAt: 'later', version: 2 },
    }

    getQueryData.mockReturnValue(oldState)
    ownRow.value = 'row-1'

    await mountProbe()

    emitBroadcast('sync', {
      version: 3,
      sheet: { id: 1, title: 'New', round: 2, activeIndex: 1, rows: [] },
    })

    expect(setQueryData).not.toHaveBeenCalled()
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useLiveState', 'session-token', 'seat-1'],
    })
  })

  it('accepts a sync broadcast even with no cached state yet', async () => {
    getQueryData.mockReturnValue(undefined)

    await mountProbe()

    emitBroadcast('sync', {
      version: 1,
      sheet: { id: 1, title: 'New', round: 1, activeIndex: 0, rows: [] },
    })

    expect(setQueryData).toHaveBeenCalled()
  })

  it('ignores a stale sync broadcast', async () => {
    getQueryData.mockReturnValue({
      sheet: { id: 1, title: 't', round: 1, activeIndex: 0, rows: [] },
      session: { code: 'ABC234', expiresAt: 'later', version: 5 },
    })

    await mountProbe()

    emitBroadcast('sync', {
      version: 5,
      sheet: { id: 1, title: 't', round: 1, activeIndex: 0, rows: [] },
    })

    expect(setQueryData).not.toHaveBeenCalled()
  })

  it('invalidates the query when coming back online', async () => {
    isOnline.value = false

    await mountProbe()

    isOnline.value = true
    await flushPromises()

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useLiveState', 'session-token', 'seat-1'],
    })
  })

  it('invalidates the query when the tab regains focus', async () => {
    visibility.value = 'hidden'

    await mountProbe()

    visibility.value = 'visible'
    await flushPromises()

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useLiveState', 'session-token', 'seat-1'],
    })
  })

  it('unsubscribes from the channel on unmount', async () => {
    const component = await mountProbe()

    component.unmount()
    mounted = undefined

    expect(unsubscribe).toHaveBeenCalled()
    expect(removeChannel).toHaveBeenCalledWith(channel)
  })
})
