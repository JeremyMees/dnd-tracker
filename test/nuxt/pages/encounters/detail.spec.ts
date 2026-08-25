import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EncounterPage from '~/pages/encounters/[id]-[title].vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { authUser } from '~~/test/fixtures/auth-user'
import { mockSheetCampaign } from '~~/test/fixtures/campaign'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const {
  getQueryData,
  invalidateQueries,
  navigateTo,
  on,
  removeChannel,
  setQueryData,
  subscribe,
  syncLiveSession,
  toast,
  unsubscribe,
  update,
  patch,
  useSeo,
} = vi.hoisted(() => ({
  getQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
  navigateTo: vi.fn(),
  on: vi.fn(),
  removeChannel: vi.fn(),
  setQueryData: vi.fn(),
  subscribe: vi.fn(),
  syncLiveSession: vi.fn(),
  toast: vi.fn(),
  unsubscribe: vi.fn(),
  update: vi.fn(),
  patch: vi.fn(),
  useSeo: vi.fn(),
}))

const channel = { on, subscribe, unsubscribe }

on.mockReturnValue(channel)
subscribe.mockReturnValue(channel)

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}))

vi.mock('@tanstack/vue-query', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useQueryClient: () => ({ getQueryData, setQueryData, invalidateQueries }),
}))

const data = ref<InitiativeSheet | undefined>()
const isPending = ref(false)
const isError = ref(false)

vi.mock('~/queries/initiative-sheets', () => ({
  useInitiativeSheetDetail: () => ({ data, isPending, isError }),
  useInitiativeSheetDetailUpdate: () => ({ mutateAsync: update }),
  useInitiativeSheetPatch: () => ({ mutateAsync: patch }),
}))

const user = ref<AuthUser>({ ...authUser })
const startTour = vi.fn()

mockNuxtImport('useSeo', () => useSeo)
mockNuxtImport('navigateTo', () => navigateTo)
mockNuxtImport('useAuthenticatedUser', () => () => user)
mockNuxtImport('useTour', () => () => ({ startTour }))
mockNuxtImport('useRoute', () => () => ({
  params: { id: '2', title: 'Sandbox' },
  path: '/encounters/2-Sandbox',
  query: {},
}))
mockNuxtImport('useSupabaseClient', () => () => ({
  channel: () => channel,
  removeChannel,
}))
mockNuxtImport('useLiveSession', () => () => ({ sync: syncLiveSession }))

const SheetProbe = defineComponent({
  props: { loading: Boolean },
  setup() {
    return validateInject(INITIATIVE_SHEET)
  },
  template: '<p test-id="table">{{ sheet?.title ?? "no sheet" }}</p>',
})

const openDropdownStub = { template: '<div><slot /></div>' }

const stubs = {
  InitiativeTable: SheetProbe,
  DropdownMenu: openDropdownStub,
  DropdownMenuTrigger: openDropdownStub,
  DropdownMenuContent: openDropdownStub,
  DropdownMenuItem: openDropdownStub,
  EncounterSidebar: {
    props: ['isExpanded'],
    template: '<div test-id="sidebar" />',
  },
  NuxtLayout: nuxtLayoutStub,
}

interface Probe {
  sheet: InitiativeSheet | undefined
  update: (payload: Partial<InitiativeSheet>) => Promise<void>
  patchRow: (rowId: string, patch: Partial<InitiativeSheetRow>) => Promise<void>
  activeRow: InitiativeSheetRow | undefined
}

async function mountPage() {
  const component = await mountSuspended(EncounterPage, { global: { stubs } })

  await flushPromises()

  return {
    component,
    get table() {
      return component.findComponent(SheetProbe)
    },
    get probe() {
      return component.findComponent(SheetProbe).vm as unknown as Probe
    },
  }
}

function emitBroadcast(event: string, payload: unknown): void {
  const call = on.mock.calls.find(
    call => call[0] === 'broadcast' && call[1].event === event,
  )
  const handler = call![2] as (arg: { payload: unknown }) => void

  handler({ payload })
}

describe('Encounter detail page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    on.mockReturnValue(channel)
    subscribe.mockReturnValue(channel)
    update.mockResolvedValue(undefined)

    user.value = { ...authUser, subscriptionType: 'pro' }
    data.value = { ...sheet, campaign: mockSheetCampaign }
    isPending.value = false
    isError.value = false
  })

  it('Should set the page seo with the title of the route', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Sandbox')
  })

  it('Should render inside the sidebar layout', async () => {
    const { component } = await mountPage()

    expect(component.get('[test-id]').attributes('test-id')).toBe('sidebar')
    expect(component.find('[test-id="sidebar"]').exists()).toBe(true)
  })

  it('Should render the title of the encounter', async () => {
    const { component } = await mountPage()

    expect(component.get('[test-id="title"]').text()).toBe(sheet.title)
    expect(component.find('[test-id="title-loader"]').exists()).toBe(false)
  })

  it('Should render a loader while the encounter has no title', async () => {
    data.value = undefined

    const { component } = await mountPage()

    expect(component.find('[test-id="title"]').exists()).toBe(false)
    expect(component.find('[test-id="title-loader"]').exists()).toBe(true)
  })

  it('Should provide the encounter to the initiative table', async () => {
    const { probe } = await mountPage()

    expect(probe.sheet?.title).toBe(sheet.title)
    expect(probe.activeRow).toBeUndefined()
  })

  it('Should pass the pending state to the initiative table', async () => {
    isPending.value = true

    const { table } = await mountPage()

    expect(table.props('loading')).toBe(true)
  })

  it('Should show the error state instead of the table when the query fails', async () => {
    isError.value = true

    const { component } = await mountPage()

    expect(component.find('[test-id="table"]').exists()).toBe(false)
    expect(component.get('[test-id="error"]').text()).toContain(
      'general.error.text',
    )
  })

  it('Should link straight back to the encounters when there is no campaign', async () => {
    data.value = { ...sheet, campaign: undefined }

    const { component } = await mountPage()

    expect(component.get('[test-id="back"]').attributes('href')).toBe(
      '/encounters',
    )
    expect(component.find('[test-id="back-campaign"]').exists()).toBe(false)
  })

  it('Should offer the campaign and the encounters as back links for a campaign encounter', async () => {
    const { component } = await mountPage()

    expect(component.find('[test-id="back"]').exists()).toBe(false)
    expect(component.get('[test-id="back-campaign"]').attributes('href')).toBe(
      '/campaigns/1-test-campaign/encounters',
    )
    expect(
      component.get('[test-id="back-encounters"]').attributes('href'),
    ).toBe('/encounters')
  })

  it('Should start the tour for a campaign encounter', async () => {
    await mountPage()

    expect(startTour).toHaveBeenCalledWith(true)
  })

  it('Should start the tour without campaign features for a personal encounter', async () => {
    data.value = { ...sheet, campaign: undefined }

    await mountPage()

    expect(startTour).toHaveBeenCalledWith(false)
  })

  it('Should subscribe to the changes of the encounter', async () => {
    await mountPage()

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

  it('Should not subscribe when the subscription of the user is too low', async () => {
    user.value = { ...authUser, subscriptionType: 'free' }

    await mountPage()

    expect(on).not.toHaveBeenCalled()
  })

  it('Should not subscribe for a personal encounter', async () => {
    data.value = { ...sheet, campaign: undefined }

    await mountPage()

    expect(on).not.toHaveBeenCalled()
  })

  it('Should merge a sequential action broadcast into the cached row', async () => {
    const current = { ...sheet, version: 3, campaign: mockSheetCampaign }

    getQueryData.mockReturnValue(current)

    await mountPage()

    emitBroadcast('action', {
      version: 4,
      row: current.rows[0]!.id,
      patch: { hitPoints: 3 },
    })

    expect(setQueryData).toHaveBeenCalledWith(['useInitiativeSheetDetail', 2], {
      ...current,
      version: 4,
      rows: [{ ...current.rows[0], hitPoints: 3 }, ...current.rows.slice(1)],
    })
  })

  it('Should keep the campaign when merging a sync broadcast', async () => {
    const current = { ...sheet, version: 2, campaign: mockSheetCampaign }

    getQueryData.mockReturnValue(current)

    await mountPage()

    emitBroadcast('sync', { version: 3, sheet: { ...sheet, title: 'Renamed' } })

    const updater = setQueryData.mock.calls[0]![1] as (old: unknown) => unknown

    expect(updater(current)).toEqual({
      ...current,
      title: 'Renamed',
      version: 3,
      campaign: mockSheetCampaign,
    })
  })

  it('Should ignore an action broadcast on a version gap and refetch instead', async () => {
    getQueryData.mockReturnValue({ ...sheet, version: 1 })

    await mountPage()

    emitBroadcast('action', { version: 5, row: sheet.rows[0]!.id, patch: {} })

    expect(setQueryData).not.toHaveBeenCalled()
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useInitiativeSheetDetail', 2],
    })
  })

  it('Should redirect and warn when the encounter is removed', async () => {
    await mountPage()

    emitBroadcast('deleted', {})

    expect(toast).toHaveBeenCalledWith({
      title: 'pages.encounter.toasts.removed.title',
      description: 'pages.encounter.toasts.removed.text',
      variant: 'warning',
    })
    expect(navigateTo).toHaveBeenCalledWith('/encounters')
    expect(setQueryData).not.toHaveBeenCalled()
  })

  it('Should leave the channel when the page unmounts', async () => {
    const { component } = await mountPage()

    component.unmount()

    expect(unsubscribe).toHaveBeenCalled()
    expect(removeChannel).toHaveBeenCalledWith(channel)
  })

  it('Should update the encounter with the provided update', async () => {
    const { probe } = await mountPage()

    await probe.update({ title: 'Renamed' })

    expect(update).toHaveBeenCalledWith({
      data: { title: 'Renamed' },
      id: 2,
      onSettled: expect.any(Function),
    })
  })

  it('Should not update when there is no encounter', async () => {
    data.value = undefined

    const { component } = await mountPage()
    const probe = component.findComponent(SheetProbe).vm as unknown as Probe

    await probe.update({ title: 'Renamed' })

    expect(update).not.toHaveBeenCalled()
  })

  it('Should sync the live session after a successful update', async () => {
    const { probe } = await mountPage()

    await probe.update({ round: 2, activeIndex: 1 })

    expect(syncLiveSession).toHaveBeenCalledWith({ round: 2, activeIndex: 1 })
  })

  it('Should not sync the live session when the update fails', async () => {
    update.mockRejectedValueOnce(new Error('Boom'))

    const { probe } = await mountPage()

    await expect(probe.update({ title: 'Renamed' })).rejects.toThrow('Boom')

    expect(syncLiveSession).not.toHaveBeenCalled()
  })

  it('Should leave the cache to realtime when the update settles', async () => {
    const { probe } = await mountPage()

    await probe.update({ title: 'Renamed' })

    await update.mock.calls[0]![0].onSettled(undefined)

    expect(setQueryData).not.toHaveBeenCalled()
  })

  it('Should update the cache itself when the update settles without realtime', async () => {
    user.value = { ...authUser, subscriptionType: 'free' }

    const { probe } = await mountPage()

    await probe.update({ title: 'Renamed' })

    await update.mock.calls[0]![0].onSettled(undefined)

    expect(setQueryData).toHaveBeenCalledWith(
      ['useInitiativeSheetDetail', 2],
      expect.any(Function),
    )
  })

  it('Should not update the cache when the update settles with an error', async () => {
    user.value = { ...authUser, subscriptionType: 'free' }

    const { probe } = await mountPage()

    await probe.update({ title: 'Renamed' })

    await update.mock.calls[0]![0].onSettled('Boom')

    expect(setQueryData).not.toHaveBeenCalled()
  })

  it('Should patch a single row through useInitiativeSheetPatch', async () => {
    const { probe } = await mountPage()

    await probe.patchRow('ylqr4a611g', { hitPoints: 3 })

    expect(patch).toHaveBeenCalledWith({
      id: 2,
      rowId: 'ylqr4a611g',
      patch: { hitPoints: 3 },
    })
  })

  it('Should not patch a row when there is no encounter', async () => {
    data.value = undefined

    const { component } = await mountPage()
    const probe = component.findComponent(SheetProbe).vm as unknown as Probe

    await probe.patchRow('ylqr4a611g', { hitPoints: 3 })

    expect(patch).not.toHaveBeenCalled()
  })
})
