import { realtime } from '~~/test/nuxt/stubs/realtime'
import { mountHook } from '~~/test/nuxt/stubs/query-client'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLiveRealtime } from '~/composables/useLiveRealtime'
import { playerRow, playerSheet } from '~~/test/fixtures/player-portal'

const { showSummary } = vi.hoisted(() => ({ showSummary: vi.fn() }))

mockNuxtImport('useSupabaseClient', () => () => realtime.client)
mockNuxtImport('useLiveSummary', () => () => ({ show: showSummary }))

const uuid = ref<string>()
const ownRow = ref<string | null>()
const queryKey = queryKeys.liveState('session-token', 'seat-token')

const cached: LiveStateResponse = {
  sheet: playerSheet,
  session: {
    code: 'ABC234',
    expiresAt: 'later',
    version: 3,
    kicked: true,
    row: 'row-1',
  },
}

function mountProbe() {
  return mountHook(() => {
    useLiveRealtime(
      computed(() => 'session-token'),
      computed(() => uuid.value),
      computed(() => 'seat-token'),
      computed(() => 'seat-1'),
      computed(() => ownRow.value),
    )

    return {}
  })
}

describe('useLiveRealtime', () => {
  let queryClient: QueryClient

  function cache(): LiveStateResponse | undefined {
    return queryClient.getQueryData<LiveStateResponse>(queryKey)
  }

  function invalidated(): boolean {
    return !!queryClient.getQueryState(queryKey)?.isInvalidated
  }

  beforeEach(async () => {
    const { vm } = await mountHook(() => ({ queryClient: useQueryClient() }))

    queryClient = vm.queryClient
    queryClient.clear()
    queryClient.setQueryData(queryKey, cached)
    realtime.reset()
    showSummary.mockClear()
    uuid.value = 'session-uuid'
    ownRow.value = null
  })

  it('subscribes to the session topic and tracks the seat once joined', async () => {
    await mountProbe()

    expect(realtime.latest()?.topic).toBe('live:session-uuid')
    expect(realtime.latest()?.track).not.toHaveBeenCalled()

    realtime.join()

    expect(realtime.latest()?.track).toHaveBeenCalledWith({ seat: 'seat-1' })
  })

  it('does not track the seat for a status other than joined', async () => {
    await mountProbe()

    realtime.latest()?.status?.('CHANNEL_ERROR')

    expect(realtime.latest()?.track).not.toHaveBeenCalled()
  })

  it('does not subscribe until a uuid is available', async () => {
    uuid.value = undefined

    await mountProbe()

    expect(realtime.channels).toHaveLength(0)
  })

  it('moves to the new topic when the uuid changes', async () => {
    await mountProbe()
    const first = realtime.latest()

    uuid.value = 'other-uuid'
    await flushPromises()

    expect(realtime.client.removeChannel).toHaveBeenCalledWith(first)
    expect(realtime.latest()?.topic).toBe('live:other-uuid')
  })

  it.each([
    { type: 'kicked', seat: 'seat-1' },
    { type: 'reassigned', seat: 'seat-1', row: 'row-2' },
  ])('refetches when the own seat is $type', async payload => {
    await mountProbe()

    realtime.emit('seats', payload)

    expect(invalidated()).toBe(true)
  })

  it.each([
    {
      type: 'joined',
      seat: { seat: 'seat-1', row: 'row-1', name: 'Elara', spectator: false },
    },
    { type: 'kicked', seat: 'someone-else' },
  ])('ignores a $type seat broadcast for another seat', async payload => {
    await mountProbe()

    realtime.emit('seats', payload)

    expect(invalidated()).toBe(false)
  })

  it('refetches when the session ends', async () => {
    await mountProbe()

    realtime.emit('ended', {})

    expect(invalidated()).toBe(true)
  })

  it('shows the combat summary', async () => {
    await mountProbe()

    realtime.emit('summary', { stats: { rounds: 3 } })

    expect(showSummary).toHaveBeenCalledWith({ rounds: 3 })
  })

  it('refetches instead of taking the shared view of the own row', async () => {
    ownRow.value = 'row-1'

    await mountProbe()

    realtime.emit('action', {
      version: 4,
      row: { ...playerRow, healthBand: 'bloodied' },
    })

    expect(cache()).toEqual(cached)
    expect(invalidated()).toBe(true)
  })

  it('takes another row from an action while owning a row', async () => {
    ownRow.value = 'row-1'

    await mountProbe()

    const goblin = { ...playerSheet.rows[1]!, healthBand: 'bloodied' as const }

    realtime.emit('action', { version: 4, row: goblin })

    expect(cache()?.sheet.rows).toEqual([playerSheet.rows[0], goblin])
    expect(invalidated()).toBe(false)
  })

  it('refetches instead of taking a snapshot while owning a row', async () => {
    ownRow.value = 'row-1'

    await mountProbe()

    realtime.emit('sync', {
      version: 4,
      sheet: { ...playerSheet, title: 'New' },
    })

    expect(cache()).toEqual(cached)
    expect(invalidated()).toBe(true)
  })

  it('keeps the session details when taking a snapshot', async () => {
    await mountProbe()

    const sheet = { ...playerSheet, title: 'New' }

    realtime.emit('sync', { version: 4, sheet })

    expect(cache()).toEqual({
      sheet,
      session: { ...cached.session, version: 4 },
    })
  })
})
