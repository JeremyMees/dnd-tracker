import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRealTimeInitiativeSheet } from '~/composables/useRealTimeInitiativeSheet'
import { authUser } from '~~/test/fixtures/auth-user'
import { mockSheetCampaign } from '~~/test/fixtures/campaign'
import { sheet } from '~~/test/fixtures/initiative-sheet'

type RealtimePayload = {
  eventType: string
  new?: Record<string, unknown>
}

const {
  navigateTo,
  on,
  removeChannel,
  setQueryData,
  subscribe,
  toast,
  unsubscribe,
} = vi.hoisted(() => ({
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
  useQueryClient: () => ({ setQueryData }),
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

function emitRealtime(payload: RealtimePayload): void {
  const handler = on.mock.calls[0]![2] as (payload: RealtimePayload) => void

  handler(payload)
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

  it('Should subscribe to the changes of the encounter when enabled', async () => {
    await mountProbe()

    expect(on).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'initiative_sheets',
        filter: 'id=eq.2',
      },
      expect.any(Function),
    )
    expect(subscribe).toHaveBeenCalled()
  })

  it('Should not subscribe when disabled', async () => {
    data.value = { ...sheet, campaign: undefined }

    await mountProbe()

    expect(on).not.toHaveBeenCalled()
  })

  it('Should update the cached encounter with a realtime change', async () => {
    await mountProbe()

    emitRealtime({ eventType: 'UPDATE', new: { title: 'Renamed' } })

    expect(setQueryData).toHaveBeenCalledWith(
      ['useInitiativeSheetDetail', 2],
      expect.any(Function),
    )
  })

  it('Should keep the campaign when merging a realtime change', async () => {
    await mountProbe()

    emitRealtime({ eventType: 'UPDATE', new: { title: 'Renamed' } })

    const merge = setQueryData.mock.calls[0]![1]

    expect(merge({ ...sheet, campaign: mockSheetCampaign })).toEqual({
      ...sheet,
      title: 'Renamed',
      campaign: mockSheetCampaign,
    })
  })

  it('Should merge a realtime change without a campaign to keep', async () => {
    await mountProbe()

    emitRealtime({ eventType: 'UPDATE', new: { title: 'Renamed' } })

    const merge = setQueryData.mock.calls[0]![1]

    expect(merge({ ...sheet, campaign: undefined })).toEqual({
      ...sheet,
      title: 'Renamed',
      campaign: undefined,
    })
  })

  it('Should not merge a realtime change into a missing cache entry', async () => {
    await mountProbe()

    emitRealtime({ eventType: 'UPDATE', new: { title: 'Renamed' } })

    const merge = setQueryData.mock.calls[0]![1]

    expect(merge(undefined)).toBeUndefined()
  })

  it('Should ignore a realtime change without data', async () => {
    await mountProbe()

    emitRealtime({ eventType: 'UPDATE', new: {} })

    expect(setQueryData).not.toHaveBeenCalled()
  })

  it('Should redirect and warn when the encounter is removed', async () => {
    await mountProbe()

    emitRealtime({ eventType: 'DELETE' })

    expect(toast).toHaveBeenCalledWith({
      title: 'pages.encounter.toasts.removed.title',
      description: 'pages.encounter.toasts.removed.text',
      variant: 'warning',
    })
    expect(navigateTo).toHaveBeenCalledWith('/encounters')
    expect(setQueryData).not.toHaveBeenCalled()
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
