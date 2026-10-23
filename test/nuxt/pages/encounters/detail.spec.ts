import { toast } from '~~/test/nuxt/stubs/toast'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EncounterPage from '~/pages/encounters/[id]-[title].vue'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { authUser } from '~~/test/fixtures/auth-user'
import { mockSheetCampaign } from '~~/test/fixtures/campaign'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

const {
  getQueryData,
  invalidateQueries,
  logEvents,
  navigateTo,
  on,
  removeChannel,
  setQueryData,
  subscribe,
  update,
  patch,
  patchRows,
  turn,
  useSeo,
} = vi.hoisted(() => ({
  getQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
  logEvents: vi.fn(),
  navigateTo: vi.fn(),
  on: vi.fn(),
  removeChannel: vi.fn(),
  setQueryData: vi.fn(),
  subscribe: vi.fn(),
  update: vi.fn(),
  patch: vi.fn(),
  patchRows: vi.fn(),
  turn: vi.fn(),
  useSeo: vi.fn(),
}))

const channel = { on, subscribe }

on.mockReturnValue(channel)
subscribe.mockReturnValue(channel)

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
  useInitiativeSheetPatchRows: () => ({ mutateAsync: patchRows }),
  useInitiativeSheetTurn: () => ({ mutateAsync: turn }),
  withPendingEdits: (_client: unknown, _id: number, sheet: InitiativeSheet) =>
    sheet,
}))

vi.mock('~/queries/combat-events', () => ({
  useCombatEventsLog: () => ({ mutate: logEvents }),
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
const liveSeats = ref<LiveSeat[]>([])

mockNuxtImport('useLiveSession', () => () => ({
  session: ref(undefined),
}))
mockNuxtImport('useLiveSeats', () => () => ({ seats: liveSeats }))

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
  updateSheet: (fields: SheetFieldsUpdate) => Promise<void>
  editRows: (rows: InitiativeSheetRow[]) => Promise<void>
  patchRow: (rowId: string, patch: Partial<InitiativeSheetRow>) => Promise<void>
  patchRows: (patches: RowPatch[]) => Promise<void>
  nextTurn: () => Promise<TurnReminders | undefined>
  onTurnReminders: (callback: (reminders: TurnReminders) => void) => void
  log: (events: CombatEventDraft[]) => void
  activeRow: InitiativeSheetRow | undefined
  claimedRows?: Set<string>
}

let mounted: VueWrapper | undefined

async function mountPage() {
  const component = await mountWithTooltips(EncounterPage, {
    global: { stubs },
  })

  mounted = component

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
    on.mockReturnValue(channel)
    subscribe.mockReturnValue(channel)
    update.mockResolvedValue(undefined)

    user.value = { ...authUser, subscriptionType: 'pro' }
    data.value = { ...sheet, campaign: mockSheetCampaign }
    isPending.value = false
    isError.value = false
    logEvents.mockReset()
  })

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
  })

  it('Should set the page seo with the title of the encounter', async () => {
    await mountPage()

    const title = useSeo.mock.calls[0]![0] as () => string | undefined

    expect(title()).toBe(sheet.title)
  })

  it('Should keep the page seo title in sync with the encounter', async () => {
    await mountPage()

    const title = useSeo.mock.calls[0]![0] as () => string | undefined

    data.value = { ...sheet, title: 'Renamed encounter' }

    expect(title()).toBe('Renamed encounter')
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

  it('Should provide the rows players have claimed in the live session', async () => {
    liveSeats.value = [
      { seat: 'seat-1', row: 'row-1', name: 'Elara', spectator: false },
      { seat: 'seat-2', row: null, name: 'Watcher', spectator: true },
    ]

    const { probe } = await mountPage()

    expect([...probe.claimedRows!]).toEqual(['row-1'])

    liveSeats.value = []
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
    expect(component.get('[test-id="back"]').attributes('aria-label')).toBe(
      'actions.back',
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

  it('Should subscribe for a personal encounter', async () => {
    data.value = { ...sheet, campaign: undefined }

    await mountPage()

    expect(subscribe).toHaveBeenCalled()
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

    emitBroadcast('sync', { version: 3, sheet: { title: 'Renamed' } })

    expect(setQueryData).toHaveBeenCalledWith(['useInitiativeSheetDetail', 2], {
      ...current,
      title: 'Renamed',
      version: 3,
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

    expect(toast.warning).toHaveBeenCalledWith(
      'pages.encounter.toasts.removed.title',
      { description: 'pages.encounter.toasts.removed.text' },
    )
    expect(navigateTo).toHaveBeenCalledWith('/encounters')
    expect(setQueryData).not.toHaveBeenCalled()
  })

  it('Should leave the channel when the page unmounts', async () => {
    const { component } = await mountPage()

    component.unmount()

    expect(removeChannel).toHaveBeenCalledWith(channel)
  })

  it('Should update the encounter with the provided update', async () => {
    const { probe } = await mountPage()

    await probe.updateSheet({ round: 4 })

    expect(update).toHaveBeenCalledWith({ data: { round: 4 }, id: 2 })
  })

  it('Should not update when there is no encounter', async () => {
    data.value = undefined

    const { component } = await mountPage()
    const probe = component.findComponent(SheetProbe).vm as unknown as Probe

    await probe.updateSheet({ round: 4 })

    expect(update).not.toHaveBeenCalled()
  })

  it('Should leave logging the changes of an update to the server', async () => {
    const { probe } = await mountPage()
    const [, ...rest] = sheet.rows

    await probe.editRows(rest)

    expect(logEvents).not.toHaveBeenCalled()
  })

  it('Should provide a log that posts the events of the encounter', async () => {
    const { probe } = await mountPage()
    const events: CombatEventDraft[] = [
      { type: 'roll', rowId: null, payload: { kind: 'dice', total: 4 } },
    ]

    probe.log(events)
    probe.log([])

    expect(logEvents).toHaveBeenCalledOnce()
    expect(logEvents).toHaveBeenCalledWith({ encounterId: 2, events })
  })

  it('Should refetch the combat log when another client logged events', async () => {
    await mountPage()

    emitBroadcast('events', {})

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useCombatEvents', 2],
    })
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

  it('Should patch several rows in one batch through useInitiativeSheetPatchRows', async () => {
    const { probe } = await mountPage()
    const patches = [
      { rowId: 'ylqr4a611g', patch: { hitPoints: 3 } },
      { rowId: 'zywxbg0xy9', patch: { hitPoints: 4 } },
    ]

    await probe.patchRows(patches)

    expect(patchRows).toHaveBeenCalledWith({ id: 2, patches })
    expect(patch).not.toHaveBeenCalled()
  })

  it('Should not patch rows when there is no encounter', async () => {
    data.value = undefined

    const { component } = await mountPage()
    const probe = component.findComponent(SheetProbe).vm as unknown as Probe

    await probe.patchRows([{ rowId: 'ylqr4a611g', patch: { hitPoints: 3 } }])

    expect(patchRows).not.toHaveBeenCalled()
  })

  it('Should advance the turn through useInitiativeSheetTurn and return the reminders', async () => {
    const expired: TurnReminder[] = [
      {
        rowId: 'ylqr4a611g',
        rowName: 'Sister Iarnă',
        condition: { id: 'prone', name: 'Prone', desc: 'Down.' },
      },
    ]
    turn.mockResolvedValue({ sheet: {}, expired, saves: [], recharges: [] })

    const { probe } = await mountPage()

    await expect(probe.nextTurn()).resolves.toEqual({
      expired,
      saves: [],
      recharges: [],
    })
    expect(turn).toHaveBeenCalledWith({ id: 2 })
  })

  it('Should hand the reminders of a portal turn to the table', async () => {
    const reminders: TurnReminders = {
      expired: [
        {
          rowId: 'ylqr4a611g',
          rowName: 'Sister Iarnă',
          condition: { id: 'prone', name: 'Prone', desc: 'Down.' },
        },
      ],
      saves: [],
      recharges: [],
    }
    const listener = vi.fn()

    getQueryData.mockReturnValue({ ...sheet, version: 2 })

    const { probe } = await mountPage()

    probe.onTurnReminders(listener)
    emitBroadcast('sync', { version: 3, sheet, reminders })

    expect(listener).toHaveBeenCalledWith(reminders)
  })

  it('Should not advance the turn when there is no encounter', async () => {
    data.value = undefined

    const { component } = await mountPage()
    const probe = component.findComponent(SheetProbe).vm as unknown as Probe

    await probe.nextTurn()

    expect(turn).not.toHaveBeenCalled()
  })
})
