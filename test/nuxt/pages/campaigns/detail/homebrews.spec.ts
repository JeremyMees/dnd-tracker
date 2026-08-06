import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Homebrews from '~/pages/campaigns/[id]-[title]/homebrews.vue'
import { campaignPageProps } from '~~/test/fixtures/campaign'
import { mockHomebrewItem } from '~~/test/fixtures/homebrew'
import { createListingStubs, tableState } from '~~/test/nuxt/stubs/table'

const {
  ask,
  expandedMarkup,
  initialState,
  invalidateQueries,
  open,
  removeHomebrew,
  useSeo,
} = vi.hoisted(() => ({
  ask: vi.fn(),
  expandedMarkup: () => undefined,
  initialState: { sorting: [{ id: 'createdAt', desc: true }] },
  invalidateQueries: vi.fn(),
  open: vi.fn(),
  removeHomebrew: vi.fn(),
  useSeo: vi.fn(),
}))

vi.mock('@tanstack/vue-query', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useQueryClient: () => ({ invalidateQueries }),
}))

interface HomebrewListing {
  homebrews: HomebrewItemRow[] | null
  pages: number
  amount: number
}

const count = ref<number | undefined>(1)
const data = shallowRef<HomebrewListing>({
  homebrews: [mockHomebrewItem],
  pages: 3,
  amount: 1,
})
const status = ref<'pending' | 'success' | 'error'>('success')

let filter: ComputedRef<SbFilter> | undefined
let countEnabled: ComputedRef<boolean> | undefined
let listingEnabled: ComputedRef<boolean> | undefined
let listingPageSize: number | undefined
let countCampaign: number | undefined

vi.mock('~/queries/homebrews', () => ({
  useHomebrewCount: (id: number, enabled: ComputedRef<boolean>) => {
    countCampaign = id
    countEnabled = enabled

    return { data: count }
  },
  useHomebrewListing: (
    listing: ComputedRef<SbFilter>,
    enabled: ComputedRef<boolean>,
    pageSize: number,
  ) => {
    filter = listing
    listingEnabled = enabled
    listingPageSize = pageSize

    return { data, status }
  },
  useHomebrewRemove: () => ({ mutateAsync: removeHomebrew }),
}))

interface ColumnOptions {
  onUpdate: (item: HomebrewItemRow) => void
  hasRights: boolean
}

let columnOptions: ColumnOptions | undefined

vi.mock('~/tables/homebrew-listing', () => ({
  generateColumns: (options: ColumnOptions) => {
    columnOptions = options

    return []
  },
  expandedMarkup,
  initialState,
}))

mockNuxtImport('useSeo', () => useSeo)
mockNuxtImport('useModal', () => () => ({ open }))
mockNuxtImport('useConfirm', () => () => ({ ask }))

const show = vi.fn()
const listingStubs = createListingStubs({ show })

let mounted: VueWrapper | undefined

async function mountPage(overrides: Partial<typeof campaignPageProps> = {}) {
  const component = await mountSuspended(Homebrews, {
    props: { ...campaignPageProps, ...overrides },
    global: { stubs: listingStubs.stubs },
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

describe('Campaign homebrews page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    count.value = 1
    data.value = { homebrews: [mockHomebrewItem], pages: 3, amount: 1 }
    status.value = 'success'
    listingStubs.state.value = tableState(20)

    removeHomebrew.mockResolvedValue(undefined)
  })

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Campaign homebrews')
  })

  it('Should pass the homebrews of the listing to the table', async () => {
    const { table } = await mountPage()

    expect(table.props('data')).toEqual([mockHomebrewItem])
    expect(table.props('total')).toBe(1)
    expect(table.props('pageSize')).toBe(20)
    expect(table.props('loading')).toBe(false)
    expect(table.props('options')).toEqual({ pageCount: 3, initialState })
    expect(table.props('expandedMarkup')).toBe(expandedMarkup)
    expect(table.props('emptyMessage')).toBe('components.table.nothing')
  })

  it('Should give the table an empty listing until the homebrews arrive', async () => {
    data.value = { homebrews: null, pages: -1, amount: 0 }
    status.value = 'pending'

    const { table } = await mountPage()

    expect(table.props('data')).toEqual([])
    expect(table.props('total')).toBe(0)
    expect(table.props('loading')).toBe(true)
  })

  it('Should fill the loading table with skeleton rows', async () => {
    status.value = 'pending'

    const { component } = await mountPage()

    expect(component.findAll('[test-id="skeleton-row"]')).toHaveLength(10)
  })

  it('Should scope the listing and the count to the campaign', async () => {
    await mountPage()

    expect(countCampaign).toBe(campaignPageProps.campaignId)
    expect(listingPageSize).toBe(20)
    expect(filter?.value).toEqual({
      search: '',
      sortBy: 'createdAt',
      sortDesc: true,
      page: 0,
      eq: { field: 'campaign', value: campaignPageProps.campaignId },
    })
  })

  it('Should ask the listing for the state of the table', async () => {
    await mountPage()

    listingStubs.state.value = {
      pagination: { pageIndex: 2, pageSize: 20 },
      sorting: [{ id: 'name', desc: false }],
      globalFilter: 'goblin',
    }

    await flushPromises()

    expect(filter?.value).toEqual(
      expect.objectContaining({
        search: 'goblin',
        sortBy: 'name',
        sortDesc: false,
        page: 2,
      }),
    )
  })

  it('Should only fetch once the parent page is ready', async () => {
    await mountPage({ fetchReady: false })

    expect(countEnabled?.value).toBe(false)
    expect(listingEnabled?.value).toBe(false)
  })

  it('Should fetch when the parent page is ready', async () => {
    await mountPage()

    expect(countEnabled?.value).toBe(true)
    expect(listingEnabled?.value).toBe(true)
  })

  it('Should not let a member modify the homebrews', async () => {
    const { table } = await mountPage()

    expect(table.props('permission')).toBe(false)
    expect(columnOptions?.hasRights).toBe(false)
  })

  it('Should let an admin modify the homebrews', async () => {
    const { table } = await mountPage({ isAdmin: true })

    expect(table.props('permission')).toBe(true)
    expect(columnOptions?.hasRights).toBe(true)
  })

  it('Should let an owner modify the homebrews', async () => {
    const { table } = await mountPage({ isOwner: true })

    expect(table.props('permission')).toBe(true)
    expect(columnOptions?.hasRights).toBe(true)
  })

  it('Should count the homebrews against the maximum', async () => {
    const { contentCount } = await mountPage()

    expect(contentCount.props('count')).toBe(1)
    expect(contentCount.props('max')).toBe(100)
    expect(contentCount.props('loading')).toBe(false)
  })

  it('Should show the limit cta once the maximum is reached', async () => {
    count.value = 100

    const { component, createButton } = await mountPage()

    expect(component.find('[test-id="limit"]').exists()).toBe(true)
    expect(createButton.props('allowCreate')).toBe(false)

    createButton.vm.$emit('hitLimit')

    expect(show).toHaveBeenCalled()
  })

  it('Should hide the limit cta below the maximum', async () => {
    const { component, createButton } = await mountPage()

    expect(component.find('[test-id="limit"]').exists()).toBe(false)
    expect(createButton.props('allowCreate')).toBe(true)
  })

  it('Should not allow creating a homebrew while the count is unknown', async () => {
    count.value = undefined

    const { createButton } = await mountPage()

    expect(createButton.props('allowCreate')).toBe(false)
  })

  it('Should open the new homebrew modal when creating', async () => {
    const { create } = await mountPage()

    await create()

    expect(open).toHaveBeenCalledWith({
      component: 'Homebrew',
      header: 'components.homebrewModal.new',
      variant: 'fullScreen',
      props: { campaignId: campaignPageProps.campaignId, count: 1 },
    })
  })

  it('Should open the update modal with the homebrew of the row', async () => {
    await mountPage()

    columnOptions?.onUpdate(mockHomebrewItem)

    expect(open).toHaveBeenCalledWith({
      component: 'Homebrew',
      header: 'components.homebrewModal.update',
      variant: 'fullScreen',
      props: {
        campaignId: campaignPageProps.campaignId,
        count: 1,
        item: mockHomebrewItem,
      },
    })
  })

  it('Should ask for confirmation before removing the selected homebrews', async () => {
    const { remove } = await mountPage()

    await remove([1, 2])

    expect(ask).toHaveBeenCalledWith(
      { title: 'actions.delete 2 general.homebrew' },
      expect.any(Function),
    )
    expect(removeHomebrew).not.toHaveBeenCalled()
  })

  it('Should remove the selected homebrews when the confirmation is accepted', async () => {
    const { remove } = await mountPage()

    await remove([1, 2])
    await confirmCallback()(true)

    expect(removeHomebrew).toHaveBeenCalledWith({ id: [1, 2] })
  })

  it('Should keep the selected homebrews when the confirmation is declined', async () => {
    const { remove } = await mountPage()

    await remove([1, 2])
    await confirmCallback()(false)

    expect(removeHomebrew).not.toHaveBeenCalled()
  })

  it('Should invalidate the listing and the count when the table asks for it', async () => {
    const { component } = await mountPage()

    component.findComponent(listingStubs.DataTable).vm.$emit('invalidate')

    await flushPromises()

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useHomebrewListing'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useHomebrewCount'],
    })
  })

  it('Should offer a refresh when the listing fails', async () => {
    status.value = 'error'

    const { component } = await mountPage()

    expect(component.find('[test-id="refresh"]').exists()).toBe(true)

    component.findComponent(listingStubs.RefreshCard).vm.$emit('refresh')

    await flushPromises()

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useHomebrewListing'],
    })
  })

  it('Should not offer a refresh while the listing works', async () => {
    const { component } = await mountPage()

    expect(component.find('[test-id="refresh"]').exists()).toBe(false)
  })
})
