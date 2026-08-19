import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Campaigns from '~/pages/campaigns/index.vue'
import { isCampaignOwner } from '~~/shared/utils/abilities'
import { authUser } from '~~/test/fixtures/auth-user'
import { mockCampaignItem } from '~~/test/fixtures/campaign'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'
import { createListingStubs, tableState } from '~~/test/nuxt/stubs/table'

const {
  allows,
  ask,
  initialState,
  invalidateQueries,
  open,
  removeCampaign,
  removeTeamMember,
  toast,
  useSeo,
} = vi.hoisted(() => ({
  allows: vi.fn(),
  ask: vi.fn(),
  initialState: { sorting: [{ id: 'createdAt', desc: true }] },
  invalidateQueries: vi.fn(),
  open: vi.fn(),
  removeCampaign: vi.fn(),
  removeTeamMember: vi.fn(),
  toast: vi.fn(),
  useSeo: vi.fn(),
}))

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}))

vi.mock('@tanstack/vue-query', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useQueryClient: () => ({ invalidateQueries }),
}))

const count = ref<number | undefined>(1)
const listing = ref<{ campaigns: CampaignItem[] | null; pages: number }>({
  campaigns: [mockCampaignItem],
  pages: 3,
})
const status = ref<'pending' | 'success' | 'error'>('success')

let filter: ComputedRef<SbFilter> | undefined

vi.mock('~/queries/campaigns', () => ({
  useCampaignCount: () => ({ data: count }),
  useCampaignListing: (data: ComputedRef<SbFilter>) => {
    filter = data

    return { data: listing, status }
  },
  useCampaignRemove: () => ({ mutateAsync: removeCampaign }),
}))

vi.mock('~/queries/team-members', () => ({
  useTeamMemberRemove: () => ({ mutateAsync: removeTeamMember }),
}))

interface ColumnOptions {
  onUpdate: (item: CampaignItem) => void
  onLeave: (item: CampaignItem) => Promise<void>
}

let columnOptions: ColumnOptions | undefined

vi.mock('~/tables/campaign-listing', () => ({
  generateColumns: (options: ColumnOptions) => {
    columnOptions = options

    return []
  },
  initialState,
}))

const user = ref<AuthUser>({ ...authUser })

mockNuxtImport('useSeo', () => useSeo)
mockNuxtImport('allows', () => allows)
mockNuxtImport('useAuthenticatedUser', () => () => user)
mockNuxtImport('useModal', () => () => ({ open }))
mockNuxtImport('useConfirm', () => () => ({ ask }))

const show = vi.fn()

const listingStubs = createListingStubs({ show })
const stubs = { ...listingStubs.stubs, NuxtLayout: nuxtLayoutStub }

let mounted: VueWrapper | undefined

async function mountPage() {
  const component = await mountSuspended(Campaigns, { global: { stubs } })

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

function modalEvents(): { finished: () => void } {
  return open.mock.calls[0]![0].events
}

describe('Campaigns page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    count.value = 1
    listing.value = { campaigns: [mockCampaignItem], pages: 3 }
    status.value = 'success'
    user.value = { ...authUser }
    listingStubs.state.value = tableState()

    removeCampaign.mockResolvedValue(undefined)
    removeTeamMember.mockResolvedValue(undefined)
  })

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Campaigns')
  })

  it('Should render inside the sidebar layout with the campaigns header', async () => {
    const { component } = await mountPage()

    const layout = component.get('[test-id]')

    expect(layout.attributes('test-id')).toBe('sidebar')
  })

  it('Should pass the campaigns of the listing to the table', async () => {
    const { table } = await mountPage()

    expect(table.props('data')).toEqual([mockCampaignItem])
    expect(table.props('loading')).toBe(false)
    expect(table.props('options')).toEqual({ pageCount: 3, initialState })
    expect(table.props('emptyMessage')).toBe('components.table.nothing')
  })

  it('Should give the table an empty listing until the campaigns arrive', async () => {
    listing.value = { campaigns: null, pages: -1 }
    status.value = 'pending'

    const { table } = await mountPage()

    expect(table.props('data')).toEqual([])
    expect(table.props('loading')).toBe(true)
  })

  it('Should fill the loading table with skeleton rows', async () => {
    status.value = 'pending'

    const { component } = await mountPage()

    expect(component.findAll('[test-id="skeleton-row"]')).toHaveLength(10)
  })

  it('Should only allow the owner of a campaign to select it', async () => {
    allows.mockResolvedValue(true)

    const { table } = await mountPage()

    const permission = table.props('permission') as (
      item: CampaignItem,
    ) => Promise<boolean>

    await expect(permission(mockCampaignItem)).resolves.toBe(true)
    expect(allows).toHaveBeenCalledWith(isCampaignOwner, mockCampaignItem)
  })

  it('Should ask the listing for the first page sorted by the initial state', async () => {
    await mountPage()

    expect(filter?.value).toEqual({
      search: '',
      sortBy: 'createdAt',
      sortDesc: true,
      page: 0,
    })
  })

  it('Should ask the listing for the state of the table', async () => {
    await mountPage()

    listingStubs.state.value = {
      pagination: { pageIndex: 2, pageSize: 10 },
      sorting: [{ id: 'title', desc: false }],
      globalFilter: 'strahd',
    }

    await flushPromises()

    expect(filter?.value).toEqual({
      search: 'strahd',
      sortBy: 'title',
      sortDesc: false,
      page: 2,
    })
  })

  it('Should count the campaigns against the maximum of the subscription', async () => {
    const { contentCount } = await mountPage()

    expect(contentCount.props('count')).toBe(1)
    expect(contentCount.props('max')).toBe(3)
    expect(contentCount.props('loading')).toBe(false)
  })

  it('Should raise the maximum for a paid subscription', async () => {
    user.value = { ...authUser, subscriptionType: 'pro' }

    const { contentCount } = await mountPage()

    expect(contentCount.props('max')).toBe(25)
  })

  it('Should show the limit cta once the maximum is reached', async () => {
    count.value = 3

    const { component } = await mountPage()

    expect(component.find('[test-id="limit"]').exists()).toBe(true)
  })

  it('Should hide the limit cta below the maximum', async () => {
    const { component } = await mountPage()

    expect(component.find('[test-id="limit"]').exists()).toBe(false)
  })

  it('Should allow creating a campaign below the maximum', async () => {
    const { createButton } = await mountPage()

    expect(createButton.props('allowCreate')).toBe(true)
    expect(createButton.props('disabled')).toBe(false)
    expect(createButton.props('loading')).toBe(false)
  })

  it('Should not allow creating a campaign on the maximum', async () => {
    count.value = 3

    const { createButton } = await mountPage()

    expect(createButton.props('allowCreate')).toBe(false)
  })

  it('Should not allow creating a campaign while the count is unknown', async () => {
    count.value = undefined

    const { createButton } = await mountPage()

    expect(createButton.props('allowCreate')).toBe(false)
  })

  it('Should show the limit cta when the create button hits the limit', async () => {
    count.value = 3

    const { component } = await mountPage()

    component.findComponent(listingStubs.CreateButton).vm.$emit('hitLimit')

    expect(show).toHaveBeenCalled()
  })

  it('Should open the add modal when creating a campaign', async () => {
    const { create } = await mountPage()

    await create()

    expect(open).toHaveBeenCalledWith({
      component: 'Campaign',
      header: 'components.campaignModal.add',
      events: { finished: expect.any(Function) },
    })
  })

  it('Should open the update modal with the campaign of the row', async () => {
    await mountPage()

    columnOptions?.onUpdate(mockCampaignItem)

    expect(open).toHaveBeenCalledWith({
      component: 'Campaign',
      header: 'components.campaignModal.update',
      events: { finished: expect.any(Function) },
      props: { campaign: mockCampaignItem },
    })
  })

  it('Should invalidate the listing and the count when the modal finishes', async () => {
    const { create } = await mountPage()

    await create()

    modalEvents().finished()

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useCampaignListing'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useCampaignCount'],
    })
  })

  it('Should invalidate the listing when the table asks for it', async () => {
    const { component } = await mountPage()

    component.findComponent(listingStubs.DataTable).vm.$emit('invalidate')

    await flushPromises()

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useCampaignListing'],
    })
  })

  it('Should ask for confirmation before removing the selected campaigns', async () => {
    const { remove } = await mountPage()

    await remove([1, 2])

    expect(ask).toHaveBeenCalledWith(
      { title: 'actions.delete 2 general.campaign' },
      expect.any(Function),
    )
    expect(removeCampaign).not.toHaveBeenCalled()
  })

  it('Should remove the selected campaigns when the confirmation is accepted', async () => {
    const { remove } = await mountPage()

    await remove([1, 2])
    await confirmCallback()(true)

    expect(removeCampaign).toHaveBeenCalledWith({ id: [1, 2] })
  })

  it('Should keep the selected campaigns when the confirmation is declined', async () => {
    const { remove } = await mountPage()

    await remove([1, 2])
    await confirmCallback()(false)

    expect(removeCampaign).not.toHaveBeenCalled()
  })

  it('Should ask for confirmation before leaving a campaign', async () => {
    const campaign = {
      ...mockCampaignItem,
      team: [
        {
          id: 5,
          role: 'Member' as UserRole,
          user: { id: authUser.id, username: 'aldric', avatar: 'avatar-url' },
        },
      ],
    }

    await mountPage()

    await columnOptions?.onLeave(campaign)

    expect(ask).toHaveBeenCalledWith(
      {
        title: 'pages.campaigns.dialog.leave.title',
        description: 'pages.campaigns.dialog.leave.text',
      },
      expect.any(Function),
    )

    await confirmCallback()(true)

    expect(removeTeamMember).toHaveBeenCalledWith({
      member: 5,
      campaign: campaign.id,
    })
  })

  it('Should not leave a campaign the user is no member of', async () => {
    await mountPage()

    await columnOptions?.onLeave(mockCampaignItem)

    expect(ask).not.toHaveBeenCalled()
  })

  it('Should toast when leaving a campaign fails', async () => {
    removeTeamMember.mockRejectedValue(new Error('Boom'))

    const campaign = {
      ...mockCampaignItem,
      team: [
        {
          id: 5,
          role: 'Member' as UserRole,
          user: { id: authUser.id, username: 'aldric', avatar: 'avatar-url' },
        },
      ],
    }

    await mountPage()

    await columnOptions?.onLeave(campaign)
    await confirmCallback()(true)

    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'general.error.text',
      variant: 'destructive',
    })
  })

  it('Should offer a refresh when the listing fails', async () => {
    status.value = 'error'

    const { component } = await mountPage()

    expect(component.find('[test-id="refresh"]').exists()).toBe(true)

    component.findComponent(listingStubs.RefreshCard).vm.$emit('refresh')

    await flushPromises()

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useCampaignListing'],
    })
  })

  it('Should not offer a refresh while the listing works', async () => {
    const { component } = await mountPage()

    expect(component.find('[test-id="refresh"]').exists()).toBe(false)
  })
})
