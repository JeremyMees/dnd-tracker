import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Encounters from '~/components/templates/Encounters.vue'
import { canUpdateEncounter } from '~~/shared/utils/abilities'
import { authUser } from '~~/test/fixtures/auth-user'
import { mockEncounterItem } from '~~/test/fixtures/encounter'
import { createListingStubs, tableState } from '~~/test/nuxt/stubs/table'

const {
  allows,
  ask,
  clipboardCopy,
  fetchMock,
  initialState,
  invalidateQueries,
  open,
  removeEncounter,
  copyEncounter,
  toast,
} = vi.hoisted(() => ({
  allows: vi.fn(),
  ask: vi.fn(),
  clipboardCopy: vi.fn(),
  fetchMock: vi.fn(),
  initialState: { sorting: [{ id: 'createdAt', desc: true }] },
  invalidateQueries: vi.fn(),
  open: vi.fn(),
  removeEncounter: vi.fn(),
  copyEncounter: vi.fn(),
  toast: vi.fn(),
}))

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}))

vi.mock('@tanstack/vue-query', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useQueryClient: () => ({ invalidateQueries }),
}))

const count = ref<number | undefined>(1)
const listing = shallowRef<{
  encounters: EncounterItem[] | null
  amount?: number
  pages: number
}>({
  encounters: [mockEncounterItem],
  amount: 1,
  pages: 3,
})
const status = ref<'pending' | 'success' | 'error'>('success')

let filter: ComputedRef<SbFilter> | undefined
let enabledRef: ComputedRef<boolean> | undefined

vi.mock('~/queries/encounters', () => ({
  useEncounterCount: () => ({ data: count }),
  useEncounterListing: (
    data: ComputedRef<SbFilter>,
    enabled: ComputedRef<boolean>,
  ) => {
    filter = data
    enabledRef = enabled

    return { data: listing, status }
  },
  useEncounterRemove: () => ({ mutateAsync: removeEncounter }),
  useEncounterCopy: () => ({ mutateAsync: copyEncounter }),
}))

interface ColumnOptions {
  isCampaign: boolean
  onShare: (item: EncounterItem) => Promise<void>
  onUpdate: (item: EncounterItem) => void
  onCopy: (payload: { data: EncounterItem }) => Promise<void>
}

let columnOptions: ColumnOptions | undefined

vi.mock('~/tables/encounter-listing', () => ({
  generateColumns: (options: ColumnOptions) => {
    columnOptions = options

    return []
  },
  initialState,
}))

const user = ref<AuthUser>({ ...authUser })

mockNuxtImport('allows', () => allows)
mockNuxtImport('useAuthenticatedUser', () => () => user)
mockNuxtImport('useModal', () => () => ({ open }))
mockNuxtImport('useConfirm', () => () => ({ ask }))
mockNuxtImport('useClipboard', () => () => ({ copy: clipboardCopy }))
mockNuxtImport('$fetch', () => fetchMock)

const show = vi.fn()

const listingStubs = createListingStubs({ show })
const stubs = { ...listingStubs.stubs }

let mounted: VueWrapper | undefined

async function mountEncounters(
  props: { campaignId?: number; fetchReady?: boolean } = {},
) {
  const component = await mountSuspended(Encounters, {
    props: { fetchReady: true, ...props },
    global: { stubs },
  })

  mounted = component

  await flushPromises()

  return {
    component,
    get table() {
      return component.findComponent(listingStubs.DataTable)
    },
    get contentCount() {
      return component.findComponent(listingStubs.ContentCount)
    },
    get createButton() {
      return component.findComponent(listingStubs.CreateButton)
    },
    async create() {
      component.findComponent(listingStubs.CreateButton).vm.$emit('create')

      await flushPromises()
    },
    async remove(ids: number[]) {
      component.findComponent(listingStubs.DataTable).vm.$emit('remove', ids)

      await flushPromises()
    },
  }
}

function confirmCallback(): (confirmed: boolean) => Promise<void> {
  return ask.mock.calls[0]![1]
}

describe('Encounters', () => {
  beforeEach(() => {
    count.value = 1
    listing.value = { encounters: [mockEncounterItem], amount: 1, pages: 3 }
    status.value = 'success'
    user.value = { ...authUser }
    listingStubs.state.value = tableState()

    removeEncounter.mockResolvedValue(undefined)
    fetchMock.mockResolvedValue('share-token')
  })

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
  })

  it('Should pass the encounters of the listing to the table', async () => {
    const { table } = await mountEncounters()

    expect(table.props('data')).toEqual([mockEncounterItem])
    expect(table.props('loading')).toBe(false)
    expect(table.props('total')).toBe(1)
    expect(table.props('options')).toEqual({ pageCount: 3, initialState })
    expect(table.props('emptyMessage')).toBe('components.table.nothing')
  })

  it('Should give the table an empty listing until the encounters arrive', async () => {
    listing.value = { encounters: null, amount: undefined, pages: -1 }
    status.value = 'pending'

    const { table } = await mountEncounters()

    expect(table.props('data')).toEqual([])
    expect(table.props('total')).toBe(0)
    expect(table.props('loading')).toBe(true)
  })

  it('Should fill the loading table with skeleton rows', async () => {
    status.value = 'pending'

    const { component } = await mountEncounters()

    expect(component.findAll('[test-id="skeleton-row"]')).toHaveLength(10)
  })

  it('Should not scope the permission to a campaign outside of one', async () => {
    allows.mockResolvedValue(true)

    const { table } = await mountEncounters()

    const permission = table.props('permission') as (
      item: EncounterItem,
    ) => Promise<boolean>

    await expect(permission(mockEncounterItem)).resolves.toBe(true)
    expect(allows).toHaveBeenCalledWith(
      canUpdateEncounter,
      mockEncounterItem,
      false,
    )
  })

  it('Should scope the permission to a campaign inside one', async () => {
    allows.mockResolvedValue(true)

    const { table } = await mountEncounters({ campaignId: 7 })

    const permission = table.props('permission') as (
      item: EncounterItem,
    ) => Promise<boolean>

    await permission(mockEncounterItem)

    expect(allows).toHaveBeenCalledWith(
      canUpdateEncounter,
      mockEncounterItem,
      true,
    )
  })

  it('Should ask the listing for the first page sorted by the initial state', async () => {
    await mountEncounters()

    expect(filter?.value).toEqual({
      search: '',
      sortBy: 'createdAt',
      sortDesc: true,
      page: 0,
      eq: undefined,
    })
  })

  it('Should ask the listing for the state of the table', async () => {
    await mountEncounters()

    listingStubs.state.value = {
      pagination: { pageIndex: 2, pageSize: 10 },
      sorting: [{ id: 'title', desc: false }],
      globalFilter: 'goblin',
    }

    await flushPromises()

    expect(filter?.value).toEqual({
      search: 'goblin',
      sortBy: 'title',
      sortDesc: false,
      page: 2,
      eq: undefined,
    })
  })

  it('Should scope the listing to the campaign when a campaignId is given', async () => {
    await mountEncounters({ campaignId: 7 })

    expect(filter?.value.eq).toEqual({ field: 'campaign', value: 7 })
  })

  it('Should not build isCampaign columns outside of a campaign', async () => {
    await mountEncounters()

    expect(columnOptions?.isCampaign).toBe(false)
  })

  it('Should build isCampaign columns inside a campaign', async () => {
    await mountEncounters({ campaignId: 7 })

    expect(columnOptions?.isCampaign).toBe(true)
  })

  it('Should gate fetching on the fetchReady prop', async () => {
    await mountEncounters({ fetchReady: false })

    expect(enabledRef?.value).toBe(false)
  })

  it('Should let fetching run once fetchReady is true', async () => {
    await mountEncounters({ fetchReady: true })

    expect(enabledRef?.value).toBe(true)
  })

  it('Should count the encounters against the maximum of the subscription', async () => {
    const { contentCount } = await mountEncounters()

    expect(contentCount.props('count')).toBe(1)
    expect(contentCount.props('max')).toBe(10)
    expect(contentCount.props('loading')).toBe(false)
  })

  it('Should raise the maximum for a paid subscription', async () => {
    user.value = { ...authUser, subscriptionType: 'pro' }

    const { contentCount } = await mountEncounters()

    expect(contentCount.props('max')).toBe(250)
  })

  it('Should show the limit cta once the maximum is reached', async () => {
    count.value = 10

    const { component } = await mountEncounters()

    expect(component.find('[test-id="limit"]').exists()).toBe(true)
  })

  it('Should hide the limit cta below the maximum', async () => {
    const { component } = await mountEncounters()

    expect(component.find('[test-id="limit"]').exists()).toBe(false)
  })

  it('Should allow creating an encounter below the maximum', async () => {
    const { createButton } = await mountEncounters()

    expect(createButton.props('allowCreate')).toBe(true)
    expect(createButton.props('disabled')).toBe(false)
    expect(createButton.props('loading')).toBe(false)
  })

  it('Should not allow creating an encounter on the maximum', async () => {
    count.value = 10

    const { createButton } = await mountEncounters()

    expect(createButton.props('allowCreate')).toBe(false)
  })

  it('Should not allow creating an encounter while the count is unknown', async () => {
    count.value = undefined

    const { createButton } = await mountEncounters()

    expect(createButton.props('allowCreate')).toBe(false)
  })

  it('Should show the limit cta when the create button hits the limit', async () => {
    count.value = 10

    const { component } = await mountEncounters()

    component.findComponent(listingStubs.CreateButton).vm.$emit('hitLimit')

    expect(show).toHaveBeenCalled()
  })

  it('Should open the add modal when creating an encounter', async () => {
    const { create } = await mountEncounters()

    await create()

    expect(open).toHaveBeenCalledWith({
      component: 'Encounter',
      header: 'components.encounterModal.add',
      props: { campaignId: undefined },
    })
  })

  it('Should open the add modal scoped to the campaign', async () => {
    const { create } = await mountEncounters({ campaignId: 7 })

    await create()

    expect(open).toHaveBeenCalledWith({
      component: 'Encounter',
      header: 'components.encounterModal.add',
      props: { campaignId: 7 },
    })
  })

  it('Should open the update modal with the encounter of the row', async () => {
    await mountEncounters()

    columnOptions?.onUpdate(mockEncounterItem)

    expect(open).toHaveBeenCalledWith({
      component: 'Encounter',
      header: 'components.encounterModal.update',
      props: { encounter: mockEncounterItem, campaignId: undefined },
    })
  })

  it('Should invalidate the listing when the table asks for it', async () => {
    const { component } = await mountEncounters()

    component.findComponent(listingStubs.DataTable).vm.$emit('invalidate')

    await flushPromises()

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useEncounterListing'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useEncounterCount'],
    })
  })

  it('Should ask for confirmation before removing the selected encounters', async () => {
    const { remove } = await mountEncounters()

    await remove([1, 2])

    expect(ask).toHaveBeenCalledWith(
      { title: 'actions.delete 2 general.encounter' },
      expect.any(Function),
    )
    expect(removeEncounter).not.toHaveBeenCalled()
  })

  it('Should remove the selected encounters when the confirmation is accepted', async () => {
    const { remove } = await mountEncounters()

    await remove([1, 2])
    await confirmCallback()(true)

    expect(removeEncounter).toHaveBeenCalledWith({ id: [1, 2] })
  })

  it('Should keep the selected encounters when the confirmation is declined', async () => {
    const { remove } = await mountEncounters()

    await remove([1, 2])
    await confirmCallback()(false)

    expect(removeEncounter).not.toHaveBeenCalled()
  })

  it('Should copy a share link and toast when sharing succeeds', async () => {
    fetchMock.mockResolvedValue('share-token')

    await mountEncounters()

    await columnOptions?.onShare(mockEncounterItem)

    expect(fetchMock).toHaveBeenCalledWith('/api/encounter/share', {
      method: 'POST',
      body: { encounter: mockEncounterItem.id },
    })
    expect(clipboardCopy).toHaveBeenCalledWith(
      expect.stringContaining('share-token'),
    )
    expect(toast).toHaveBeenCalledWith({
      description: 'Goblin Ambush actions.copyclipboard',
      variant: 'info',
    })
  })

  it('Should toast an error when sharing fails to return a token', async () => {
    fetchMock.mockResolvedValue(undefined)

    await mountEncounters()

    await columnOptions?.onShare(mockEncounterItem)

    expect(clipboardCopy).not.toHaveBeenCalled()
    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'general.error.text',
      variant: 'destructive',
    })
  })

  it('Should toast an error when sharing throws', async () => {
    fetchMock.mockRejectedValue(new Error('Boom'))

    await mountEncounters()

    await columnOptions?.onShare(mockEncounterItem)

    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'general.error.text',
      variant: 'destructive',
    })
  })

  it('Should copy an encounter row', async () => {
    await mountEncounters()

    await columnOptions?.onCopy({ data: mockEncounterItem })

    expect(copyEncounter).toHaveBeenCalledWith({ data: mockEncounterItem })
  })

  it('Should offer a refresh when the listing fails', async () => {
    status.value = 'error'

    const { component } = await mountEncounters()

    expect(component.find('[test-id="refresh"]').exists()).toBe(true)

    component.findComponent(listingStubs.RefreshCard).vm.$emit('refresh')

    await flushPromises()

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useEncounterListing'],
    })
  })

  it('Should not offer a refresh while the listing works', async () => {
    const { component } = await mountEncounters()

    expect(component.find('[test-id="refresh"]').exists()).toBe(false)
  })
})
