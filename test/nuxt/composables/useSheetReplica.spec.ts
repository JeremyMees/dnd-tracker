import { realtime } from '~~/test/nuxt/stubs/realtime'
import { mountHook } from '~~/test/nuxt/stubs/query-client'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLiveRealtime } from '~/composables/useLiveRealtime'
import { useRealTimeInitiativeSheet } from '~/composables/useRealTimeInitiativeSheet'
import { authUser } from '~~/test/fixtures/auth-user'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { playerSheet } from '~~/test/fixtures/player-portal'

const isOnline = ref(true)
const visibility = ref<DocumentVisibilityState>('visible')

mockNuxtImport('useOnline', () => () => isOnline)
mockNuxtImport('useDocumentVisibility', () => () => visibility)
mockNuxtImport('useSupabaseClient', () => () => realtime.client)
mockNuxtImport(
  'useAuthenticatedUser',
  () => () => ref({ ...authUser, subscriptionType: 'pro' }),
)

interface Projection {
  name: string
  queryKey: readonly unknown[]
  mount: () => Promise<unknown>
  seed: (queryClient: QueryClient, version: number) => void
  action: (version: number, initiative: number) => unknown
  sync: (version: number, initiative: number) => unknown
  read: (
    queryClient: QueryClient,
  ) => { version: number; initiative?: number } | undefined
}

const dm: Projection = {
  name: 'the DM sheet',
  queryKey: queryKeys.initiativeSheetDetail(2),
  mount: () =>
    mountHook(() => {
      useRealTimeInitiativeSheet(2, shallowRef(sheet))

      return {}
    }),
  seed: (queryClient, version) =>
    queryClient.setQueryData(dm.queryKey, { ...sheet, version }),
  action: (version, initiative) => ({
    version,
    row: sheet.rows[0]!.id,
    patch: { initiative },
  }),
  sync: (version, initiative) => ({
    version,
    sheet: {
      rows: sheet.rows.map((row, index) =>
        index === 0 ? { ...row, initiative } : row,
      ),
    },
  }),
  read: queryClient => {
    const state = queryClient.getQueryData<InitiativeSheet>(dm.queryKey)

    return (
      state && {
        version: state.version,
        initiative: state.rows[0]?.initiative,
      }
    )
  },
}

const player: Projection = {
  name: 'the player view',
  queryKey: queryKeys.liveState('session-token', 'seat-token'),
  mount: () =>
    mountHook(() => {
      useLiveRealtime(
        computed(() => 'session-token'),
        computed(() => 'session-uuid'),
        computed(() => 'seat-token'),
        computed(() => 'seat-1'),
        computed(() => null),
      )

      return {}
    }),
  seed: (queryClient, version) =>
    queryClient.setQueryData<LiveStateResponse>(player.queryKey, {
      sheet: playerSheet,
      session: { code: 'ABC234', expiresAt: 'later', version, kicked: false },
    }),
  action: (version, initiative) => ({
    version,
    row: { ...playerSheet.rows[0], initiative },
  }),
  sync: (version, initiative) => ({
    version,
    sheet: {
      ...playerSheet,
      rows: playerSheet.rows.map((row, index) =>
        index === 0 ? { ...row, initiative } : row,
      ),
    },
  }),
  read: queryClient => {
    const state = queryClient.getQueryData<LiveStateResponse>(player.queryKey)

    return (
      state && {
        version: state.session.version,
        initiative: state.sheet.rows[0]?.initiative,
      }
    )
  },
}

describe.each([dm, player])('sheet replica for $name', projection => {
  let queryClient: QueryClient

  function invalidated(): boolean {
    return !!queryClient.getQueryState(projection.queryKey)?.isInvalidated
  }

  beforeEach(async () => {
    const { vm } = await mountHook(() => ({ queryClient: useQueryClient() }))

    queryClient = vm.queryClient
    queryClient.clear()
    realtime.reset()
    isOnline.value = true
    visibility.value = 'visible'
  })

  it('applies a sequential action', async () => {
    projection.seed(queryClient, 3)
    await projection.mount()

    realtime.emit('action', projection.action(4, 7))

    expect(projection.read(queryClient)).toEqual({ version: 4, initiative: 7 })
    expect(invalidated()).toBe(false)
  })

  it('applies a run of actions in order', async () => {
    projection.seed(queryClient, 3)
    await projection.mount()

    realtime.emit('action', projection.action(4, 7))
    realtime.emit('action', projection.action(5, 8))
    realtime.emit('action', projection.action(6, 9))

    expect(projection.read(queryClient)).toEqual({ version: 6, initiative: 9 })
    expect(invalidated()).toBe(false)
  })

  it('ignores a duplicate action', async () => {
    projection.seed(queryClient, 3)
    await projection.mount()

    realtime.emit('action', projection.action(4, 7))
    realtime.emit('action', projection.action(4, 1))

    expect(projection.read(queryClient)).toEqual({ version: 4, initiative: 7 })
  })

  it('refetches on a gap instead of applying the action', async () => {
    projection.seed(queryClient, 3)
    const before = projection.read(queryClient)
    await projection.mount()

    realtime.emit('action', projection.action(5, 7))

    expect(projection.read(queryClient)).toEqual(before)
    expect(invalidated()).toBe(true)
  })

  it('refetches when actions arrive out of order and keeps the older one', async () => {
    projection.seed(queryClient, 3)
    await projection.mount()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    realtime.emit('action', projection.action(5, 8))
    realtime.emit('action', projection.action(4, 7))

    expect(projection.read(queryClient)).toEqual({ version: 4, initiative: 7 })
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: projection.queryKey,
    })
  })

  it('takes a newer snapshot over the cache, even across a gap', async () => {
    projection.seed(queryClient, 3)
    await projection.mount()

    realtime.emit('sync', projection.sync(9, 12))

    expect(projection.read(queryClient)).toEqual({ version: 9, initiative: 12 })
    expect(invalidated()).toBe(false)
  })

  it('ignores a snapshot older than the cache', async () => {
    projection.seed(queryClient, 3)
    await projection.mount()

    realtime.emit('sync', projection.sync(5, 12))
    realtime.emit('sync', projection.sync(4, 1))
    realtime.emit('action', projection.action(5, 1))

    expect(projection.read(queryClient)).toEqual({ version: 5, initiative: 12 })
  })

  it('ignores broadcasts until the state has loaded', async () => {
    await projection.mount()

    realtime.emit('action', projection.action(1, 7))
    realtime.emit('sync', projection.sync(2, 7))

    expect(projection.read(queryClient)).toBeUndefined()
  })

  it('catches up when the channel rejoins after a drop', async () => {
    projection.seed(queryClient, 3)
    await projection.mount()

    realtime.join()
    expect(invalidated()).toBe(false)

    realtime.join()
    expect(invalidated()).toBe(true)
  })

  it('catches up when the browser comes back online', async () => {
    projection.seed(queryClient, 3)
    isOnline.value = false
    await projection.mount()

    isOnline.value = true
    await flushPromises()

    expect(invalidated()).toBe(true)
  })

  it('catches up when the tab becomes visible again', async () => {
    projection.seed(queryClient, 3)
    visibility.value = 'hidden'
    await projection.mount()

    visibility.value = 'visible'
    await flushPromises()

    expect(invalidated()).toBe(true)
  })

  it('does not catch up when going offline or hiding the tab', async () => {
    projection.seed(queryClient, 3)
    await projection.mount()

    isOnline.value = false
    visibility.value = 'hidden'
    await flushPromises()

    expect(invalidated()).toBe(false)
  })

  it('leaves the channel when unmounted', async () => {
    const { component } = (await projection.mount()) as Awaited<
      ReturnType<typeof mountHook>
    >
    const channel = realtime.latest()

    component.unmount()

    expect(realtime.client.removeChannel).toHaveBeenCalledWith(channel)
  })
})
