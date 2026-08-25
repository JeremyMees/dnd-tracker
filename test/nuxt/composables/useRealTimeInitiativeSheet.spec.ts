import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRealTimeInitiativeSheet } from '~/composables/useRealTimeInitiativeSheet'
import { authUser } from '~~/test/fixtures/auth-user'
import { mockSheetCampaign } from '~~/test/fixtures/campaign'
import { sheet } from '~~/test/fixtures/initiative-sheet'

const {
  getQueryData,
  invalidateQueries,
  navigateTo,
  on,
  removeChannel,
  setQueryData,
  subscribe,
  toast,
  unsubscribe,
} = vi.hoisted(() => ({
  getQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
  navigateTo: vi.fn(),
  on: vi.fn(),
  removeChannel: vi.fn(),
  setQueryData: vi.fn(),
  subscribe: vi.fn(),
  toast: vi.fn(),
  unsubscribe: vi.fn(),
}))

const channel = { on, subscribe, unsubscribe }

on.mockReturnValue(channel)
subscribe.mockReturnValue(channel)

vi.mock('~/components/ui/toast', () => ({
  useToast: () => ({ toast }),
}))

vi.mock('@tanstack/vue-query', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useQueryClient: () => ({ getQueryData, setQueryData, invalidateQueries }),
}))

const user = ref<AuthUser>({ ...authUser })
const data = ref<InitiativeSheet | undefined>()

mockNuxtImport('navigateTo', () => navigateTo)
mockNuxtImport('useAuthenticatedUser', () => () => user)
mockNuxtImport('useSupabaseClient', () => () => ({
  channel: () => channel,
  removeChannel,
}))

interface Probe {
  enabled: boolean
  updateQueryData: (payload: Record<string, unknown>) => void
}

const Probe = defineComponent({
  setup() {
    return useRealTimeInitiativeSheet(2, data)
  },
  template: '<div />',
})

async function mountProbe() {
  const component = await mountSuspended(Probe)

  await flushPromises()

  return { component, vm: component.vm as unknown as Probe }
}

function emitBroadcast(event: string, payload: unknown): void {
  const call = on.mock.calls.find(
    call => call[0] === 'broadcast' && call[1].event === event,
  )
  const handler = call![2] as (arg: { payload: unknown }) => void

  handler({ payload })
}

describe('useRealTimeInitiativeSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    on.mockReturnValue(channel)
    subscribe.mockReturnValue(channel)

    user.value = { ...authUser, subscriptionType: 'pro' }
    data.value = { ...sheet, campaign: mockSheetCampaign }
  })

  it('Should be enabled for a campaign encounter with a high enough subscription', async () => {
    const { vm } = await mountProbe()

    expect(vm.enabled).toBe(true)
  })

  it('Should not be enabled without an encounter', async () => {
    data.value = undefined

    const { vm } = await mountProbe()

    expect(vm.enabled).toBe(false)
  })

  it('Should not be enabled for a personal encounter', async () => {
    data.value = { ...sheet, campaign: undefined }

    const { vm } = await mountProbe()

    expect(vm.enabled).toBe(false)
  })

  it('Should not be enabled when the subscription is too low', async () => {
    user.value = { ...authUser, subscriptionType: 'free' }

    const { vm } = await mountProbe()

    expect(vm.enabled).toBe(false)
  })

  it('Should subscribe to the sheet broadcast channel when enabled', async () => {
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
    expect(on).toHaveBeenCalledWith(
      'broadcast',
      { event: 'deleted' },
      expect.any(Function),
    )
    expect(subscribe).toHaveBeenCalled()
  })

  it('Should not subscribe when disabled', async () => {
    data.value = { ...sheet, campaign: undefined }

    await mountProbe()

    expect(on).not.toHaveBeenCalled()
  })

  describe('action broadcast', () => {
    it('Should merge a sequential action into the cached row and bump the version', async () => {
      const current = { ...sheet, version: 3 }

      getQueryData.mockReturnValue(current)

      await mountProbe()

      emitBroadcast('action', {
        version: 4,
        row: current.rows[0]!.id,
        patch: { hitPoints: 3 },
      })

      expect(setQueryData).toHaveBeenCalledWith(
        ['useInitiativeSheetDetail', 2],
        {
          ...current,
          version: 4,
          rows: [
            { ...current.rows[0], hitPoints: 3 },
            ...current.rows.slice(1),
          ],
        },
      )
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['useCombatEvents', 2],
      })
    })

    it('Should invalidate instead of merging on a version gap', async () => {
      getQueryData.mockReturnValue({ ...sheet, version: 3 })

      await mountProbe()

      emitBroadcast('action', {
        version: 6,
        row: sheet.rows[0]!.id,
        patch: {},
      })

      expect(setQueryData).not.toHaveBeenCalled()
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['useInitiativeSheetDetail', 2],
      })
    })

    it('Should ignore an already-applied or stale action broadcast', async () => {
      getQueryData.mockReturnValue({ ...sheet, version: 5 })

      await mountProbe()

      emitBroadcast('action', { version: 5, row: sheet.rows[0]!.id, patch: {} })

      expect(setQueryData).not.toHaveBeenCalled()
      expect(invalidateQueries).not.toHaveBeenCalled()
    })

    it('Should ignore an action broadcast when there is no cached state yet', async () => {
      getQueryData.mockReturnValue(undefined)

      await mountProbe()

      expect(() =>
        emitBroadcast('action', {
          version: 1,
          row: sheet.rows[0]!.id,
          patch: {},
        }),
      ).not.toThrow()
      expect(setQueryData).not.toHaveBeenCalled()
      expect(invalidateQueries).not.toHaveBeenCalled()
    })
  })

  describe('sync broadcast', () => {
    it('Should replace the sheet on a newer sync broadcast while keeping the campaign', async () => {
      const current = { ...sheet, version: 2, campaign: mockSheetCampaign }

      getQueryData.mockReturnValue(current)

      await mountProbe()

      const newSheet = { ...sheet, title: 'Renamed' }

      emitBroadcast('sync', { version: 3, sheet: newSheet })

      expect(setQueryData).toHaveBeenCalledWith(
        ['useInitiativeSheetDetail', 2],
        expect.any(Function),
      )

      const updater = setQueryData.mock.calls[0]![1] as (
        old: unknown,
      ) => unknown

      expect(updater(current)).toEqual({
        ...current,
        ...newSheet,
        version: 3,
        campaign: mockSheetCampaign,
      })
    })

    it('Should merge a sync broadcast without a campaign to keep', async () => {
      const current = { ...sheet, version: 2, campaign: undefined }

      getQueryData.mockReturnValue(current)

      await mountProbe()

      emitBroadcast('sync', {
        version: 3,
        sheet: { ...sheet, title: 'Renamed' },
      })

      const updater = setQueryData.mock.calls[0]![1] as (
        old: unknown,
      ) => unknown

      expect(updater(undefined)).toEqual({
        ...sheet,
        title: 'Renamed',
        version: 3,
      })
    })

    it('Should ignore a stale sync broadcast', async () => {
      getQueryData.mockReturnValue({ ...sheet, version: 5 })

      await mountProbe()

      emitBroadcast('sync', { version: 5, sheet })

      expect(setQueryData).not.toHaveBeenCalled()
    })

    it('Should accept a sync broadcast even with no cached state yet', async () => {
      getQueryData.mockReturnValue(undefined)

      await mountProbe()

      emitBroadcast('sync', { version: 1, sheet })

      expect(setQueryData).toHaveBeenCalledWith(
        ['useInitiativeSheetDetail', 2],
        expect.any(Function),
      )
    })
  })

  describe('deleted broadcast', () => {
    it('Should redirect and warn when the encounter is removed', async () => {
      await mountProbe()

      emitBroadcast('deleted', {})

      expect(toast).toHaveBeenCalledWith({
        title: 'pages.encounter.toasts.removed.title',
        description: 'pages.encounter.toasts.removed.text',
        variant: 'warning',
      })
      expect(navigateTo).toHaveBeenCalledWith('/encounters')
      expect(setQueryData).not.toHaveBeenCalled()
    })
  })

  it('Should leave the channel when unmounted', async () => {
    const { component } = await mountProbe()

    component.unmount()

    expect(unsubscribe).toHaveBeenCalled()
    expect(removeChannel).toHaveBeenCalledWith(channel)
  })

  it('Should expose updateQueryData for manual cache writes', async () => {
    const { vm } = await mountProbe()

    vm.updateQueryData({ title: 'Manual' })

    expect(setQueryData).toHaveBeenCalledWith(
      ['useInitiativeSheetDetail', 2],
      expect.any(Function),
    )
  })
})
