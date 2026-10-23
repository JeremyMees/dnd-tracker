import { toast } from '~~/test/nuxt/stubs/toast'
import { realtime } from '~~/test/nuxt/stubs/realtime'
import { mountHook } from '~~/test/nuxt/stubs/query-client'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRealTimeInitiativeSheet } from '~/composables/useRealTimeInitiativeSheet'
import {
  useInitiativeSheetDetailUpdate,
  useInitiativeSheetPatch,
} from '~/queries/initiative-sheets'
import { authUser } from '~~/test/fixtures/auth-user'
import { mockSheetCampaign } from '~~/test/fixtures/campaign'
import { sheet } from '~~/test/fixtures/initiative-sheet'

const { fetchMock, navigateTo } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  navigateTo: vi.fn(),
}))

const user = ref<AuthUser>({ ...authUser })
const data = ref<InitiativeSheet | undefined>()
const visibility = ref<DocumentVisibilityState>('visible')

mockNuxtImport('$fetch', () => fetchMock)
mockNuxtImport('navigateTo', () => navigateTo)
mockNuxtImport('useAuthenticatedUser', () => () => user)
mockNuxtImport('useSupabaseClient', () => () => realtime.client)
mockNuxtImport('useDocumentVisibility', () => () => visibility)

const sheetKey = queryKeys.initiativeSheetDetail(2)
const eventsKey = queryKeys.combatEvents(2)
const cached: InitiativeSheet = {
  ...sheet,
  version: 3,
  campaign: mockSheetCampaign,
}

function mountProbe() {
  return mountHook(() => useRealTimeInitiativeSheet(2, data))
}

describe('useRealTimeInitiativeSheet', () => {
  let queryClient: QueryClient

  function eventsInvalidated(): boolean {
    return !!queryClient.getQueryState(eventsKey)?.isInvalidated
  }

  beforeEach(async () => {
    const { vm } = await mountHook(() => ({ queryClient: useQueryClient() }))

    queryClient = vm.queryClient
    queryClient.clear()
    queryClient.setQueryData(sheetKey, cached)
    queryClient.setQueryData(eventsKey, [{ id: 1 }])
    realtime.reset()
    navigateTo.mockClear()
    user.value = { ...authUser, subscriptionType: 'pro' }
    data.value = cached
    visibility.value = 'visible'
  })

  describe('enabled', () => {
    it('is on for a campaign encounter with a pro subscription', async () => {
      const { vm } = await mountProbe()

      expect(vm.enabled).toBe(true)
      expect(realtime.latest()?.topic).toBe('sheet:2')
    })

    it('is on for a personal encounter with a pro subscription', async () => {
      data.value = { ...cached, campaign: undefined }

      const { vm } = await mountProbe()

      expect(vm.enabled).toBe(true)
    })

    it('is off without an encounter', async () => {
      data.value = undefined

      const { vm } = await mountProbe()

      expect(vm.enabled).toBe(false)
      expect(realtime.channels).toHaveLength(0)
    })

    it('is off when the subscription is too low', async () => {
      user.value = { ...authUser, subscriptionType: 'free' }

      const { vm } = await mountProbe()

      expect(vm.enabled).toBe(false)
      expect(realtime.channels).toHaveLength(0)
    })

    it('does not catch up without a subscription', async () => {
      user.value = { ...authUser, subscriptionType: 'free' }
      visibility.value = 'hidden'
      await mountProbe()

      visibility.value = 'visible'
      await flushPromises()

      expect(queryClient.getQueryState(sheetKey)?.isInvalidated).toBe(false)
    })
  })

  describe('combat log', () => {
    it('refetches after an action', async () => {
      await mountProbe()

      realtime.emit('action', {
        version: 4,
        row: sheet.rows[0]!.id,
        patch: { hitPoints: 3 },
      })

      expect(eventsInvalidated()).toBe(true)
    })

    it('refetches after a snapshot', async () => {
      await mountProbe()

      realtime.emit('sync', { version: 4, sheet: { round: 2 } })

      expect(eventsInvalidated()).toBe(true)
    })

    it('does not refetch for a broadcast it already has', async () => {
      await mountProbe()

      realtime.emit('sync', { version: 3, sheet: { round: 2 } })

      expect(eventsInvalidated()).toBe(false)
    })

    it('refetches when catching up', async () => {
      visibility.value = 'hidden'
      await mountProbe()

      visibility.value = 'visible'
      await flushPromises()

      expect(eventsInvalidated()).toBe(true)
    })

    it('refetches when new events were logged', async () => {
      await mountProbe()

      realtime.emit('events', {})

      expect(eventsInvalidated()).toBe(true)
    })

    it('empties when it was cleared elsewhere', async () => {
      await mountProbe()

      realtime.emit('events', { cleared: true })

      expect(queryClient.getQueryData(eventsKey)).toEqual([])
    })
  })

  it('keeps the campaign when taking a snapshot', async () => {
    await mountProbe()

    realtime.emit('sync', { version: 4, sheet: { title: 'Renamed' } })

    expect(queryClient.getQueryData(sheetKey)).toEqual({
      ...cached,
      title: 'Renamed',
      version: 4,
    })
  })

  describe('turn reminders', () => {
    const reminders: TurnReminders = {
      expired: [
        {
          rowId: sheet.rows[0]!.id,
          rowName: sheet.rows[0]!.name,
          condition: { id: 'prone', name: 'Prone', desc: 'Down.' },
        },
      ],
      saves: [],
      recharges: [],
    }

    it('passes the reminders of a player turn to the listeners', async () => {
      const listener = vi.fn()
      const { vm } = await mountProbe()

      vm.onTurnReminders(listener)
      realtime.emit('sync', { version: 4, sheet: {}, reminders })

      expect(listener).toHaveBeenCalledWith(reminders)
    })

    it('does not notify for a snapshot without reminders', async () => {
      const listener = vi.fn()
      const { vm } = await mountProbe()

      vm.onTurnReminders(listener)
      realtime.emit('sync', { version: 4, sheet: {} })

      expect(listener).not.toHaveBeenCalled()
    })

    it('does not notify for a snapshot it already has', async () => {
      const listener = vi.fn()
      const { vm } = await mountProbe()

      vm.onTurnReminders(listener)
      realtime.emit('sync', { version: 3, sheet: {}, reminders })

      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('edits in flight', () => {
    const rowId = sheet.rows[0]!.id
    let release: (value: unknown) => void

    function mountWithEdits() {
      return mountHook(() => {
        useRealTimeInitiativeSheet(2, data)

        return {
          patch: useInitiativeSheetPatch().mutate,
          update: useInitiativeSheetDetailUpdate().mutate,
        }
      })
    }

    function cachedSheet(): InitiativeSheet | undefined {
      return queryClient.getQueryData<InitiativeSheet>(sheetKey)
    }

    beforeEach(() => {
      fetchMock.mockReset()
      fetchMock.mockImplementation(
        () =>
          new Promise(resolve => {
            release = resolve
          }),
      )
    })

    it('keeps a row edit through a snapshot', async () => {
      const { vm } = await mountWithEdits()

      vm.patch({ id: 2, rowId, patch: { hitPoints: 1 } })
      await flushPromises()

      realtime.emit('sync', {
        version: 4,
        sheet: {
          round: 2,
          rows: cached.rows.map(row => ({ ...row, hitPoints: 50 })),
        },
      })

      expect(cachedSheet()).toMatchObject({ version: 4, round: 2 })
      expect(cachedSheet()?.rows[0]?.hitPoints).toBe(1)
      expect(cachedSheet()?.rows[1]?.hitPoints).toBe(50)
    })

    it('keeps a row edit through an action on the same row', async () => {
      const { vm } = await mountWithEdits()

      vm.patch({ id: 2, rowId, patch: { hitPoints: 1 } })
      await flushPromises()

      realtime.emit('action', {
        version: 4,
        row: rowId,
        patch: { hitPoints: 50, initiative: 3 },
      })

      expect(cachedSheet()?.rows[0]).toMatchObject({
        hitPoints: 1,
        initiative: 3,
      })
    })

    it('keeps a sheet edit through a snapshot', async () => {
      const { vm } = await mountWithEdits()

      vm.update({ id: 2, data: { round: 7 } })
      await flushPromises()

      realtime.emit('sync', { version: 4, sheet: { round: 2 } })

      expect(cachedSheet()).toMatchObject({ version: 4, round: 7 })
    })

    it('takes the snapshot once the edit has been saved', async () => {
      const { vm } = await mountWithEdits()

      vm.patch({ id: 2, rowId, patch: { hitPoints: 1 } })
      await flushPromises()
      release({ row: {} })
      await flushPromises()

      realtime.emit('sync', {
        version: 4,
        sheet: { rows: cached.rows.map(row => ({ ...row, hitPoints: 50 })) },
      })

      expect(cachedSheet()?.rows[0]?.hitPoints).toBe(50)
    })

    it('ignores an edit to another encounter', async () => {
      const { vm } = await mountWithEdits()

      vm.patch({ id: 9, rowId, patch: { hitPoints: 1 } })
      await flushPromises()

      realtime.emit('sync', {
        version: 4,
        sheet: { rows: cached.rows.map(row => ({ ...row, hitPoints: 50 })) },
      })

      expect(cachedSheet()?.rows[0]?.hitPoints).toBe(50)
    })
  })

  it('warns and leaves when the encounter is removed', async () => {
    await mountProbe()

    realtime.emit('deleted', {})
    await flushPromises()

    expect(toast.warning).toHaveBeenCalledWith(
      'pages.encounter.toasts.removed.title',
      { description: 'pages.encounter.toasts.removed.text' },
    )
    expect(navigateTo).toHaveBeenCalledWith('/encounters')
  })

  it('writes a manual update into the cache and keeps the campaign', async () => {
    const { vm } = await mountProbe()

    vm.updateQueryData({ round: 4 })

    expect(queryClient.getQueryData(sheetKey)).toEqual({ ...cached, round: 4 })
  })
})
