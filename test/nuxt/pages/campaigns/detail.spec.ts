import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CampaignPage from '~/pages/campaigns/[id]-[title].vue'
import { isCampaignAdmin, isCampaignOwner } from '~~/shared/utils/abilities'
import { mockCampaignFull } from '~~/test/fixtures/campaign'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { allows } = vi.hoisted(() => ({ allows: vi.fn() }))

const data = ref<CampaignFull | undefined>()
const isPending = ref(false)
const isError = ref(false)
const isSuccess = ref(true)

vi.mock('~/queries/campaigns', () => ({
  useCampaignDetail: () => ({ data, isPending, isError, isSuccess }),
}))

mockNuxtImport('useSeo', () => () => {})
mockNuxtImport('allows', () => allows)
mockNuxtImport('useRoute', () => () => ({
  params: { id: '1', title: 'test-campaign' },
  path: '/campaigns/1-test-campaign/encounters',
  fullPath: '/campaigns/1-test-campaign/encounters',
  query: {},
}))

const TabStub = defineComponent({
  props: { link: String, label: String, icon: String, disabled: Boolean },
  template: '<div test-id="tab" />',
})

const PageStub = defineComponent({
  props: {
    current: Object,
    isAdmin: Boolean,
    isOwner: Boolean,
    fetchReady: Boolean,
    campaignId: Number,
  },
  template: '<div test-id="page" />',
})

const stubs = {
  TabItem: TabStub,
  NuxtPage: PageStub,
  NuxtLayout: nuxtLayoutStub,
}

function grant({ admin = false, owner = false } = {}): void {
  allows.mockImplementation(async ability => {
    if (ability === isCampaignAdmin) return admin
    if (ability === isCampaignOwner) return owner

    return false
  })
}

let mounted: VueWrapper | undefined

async function mountPage() {
  const component = await mountSuspended(CampaignPage, { global: { stubs } })

  mounted = component

  await flushPromises()

  return {
    component,
    get page() {
      return component.findComponent(PageStub)
    },
    get tabs() {
      return component
        .findAllComponents(TabStub)
        .map(tab => ({ link: tab.props('link'), label: tab.props('label') }))
    },
  }
}

describe('Campaign detail page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    data.value = { ...mockCampaignFull }
    isPending.value = false
    isError.value = false
    isSuccess.value = true

    grant()
  })

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
  })

  it('Should render inside the sidebar layout with a link back to the campaigns', async () => {
    const { component } = await mountPage()

    expect(component.get('[test-id]').attributes('test-id')).toBe('sidebar')
    expect(component.get('[test-id="back"]').attributes('href')).toBe(
      '/campaigns',
    )
  })

  it('Should render the title of the campaign', async () => {
    const { component } = await mountPage()

    expect(component.get('[test-id="title"]').text()).toBe(
      mockCampaignFull.title,
    )
    expect(component.find('[test-id="title-loader"]').exists()).toBe(false)
  })

  it('Should render a loader while the campaign is not loaded', async () => {
    isSuccess.value = false

    const { component } = await mountPage()

    expect(component.find('[test-id="title"]').exists()).toBe(false)
    expect(component.find('[test-id="title-loader"]').exists()).toBe(true)
  })

  it('Should render the tabs a member is allowed to see', async () => {
    const { tabs } = await mountPage()

    expect(tabs).toEqual([
      {
        link: '/campaigns/1-test-campaign/encounters',
        label: 'general.encounter',
      },
      {
        link: '/campaigns/1-test-campaign/homebrews',
        label: 'general.homebrew',
      },
      { link: '/campaigns/1-test-campaign/notes', label: 'general.note' },
    ])
  })

  it('Should add the settings tab for an admin', async () => {
    grant({ admin: true })

    const { tabs } = await mountPage()

    expect(tabs.map(tab => tab.link)).toContain(
      '/campaigns/1-test-campaign/settings',
    )
    expect(tabs.map(tab => tab.link)).not.toContain(
      '/campaigns/1-test-campaign/danger-zone',
    )
  })

  it('Should add the settings and danger zone tabs for an owner', async () => {
    grant({ admin: true, owner: true })

    const { tabs } = await mountPage()

    expect(tabs.map(tab => tab.link)).toEqual([
      '/campaigns/1-test-campaign/encounters',
      '/campaigns/1-test-campaign/homebrews',
      '/campaigns/1-test-campaign/notes',
      '/campaigns/1-test-campaign/settings',
      '/campaigns/1-test-campaign/danger-zone',
    ])
  })

  it('Should build the tab links from the page the user is on', async () => {
    const { tabs } = await mountPage()

    expect(
      tabs.every(tab => tab.link?.startsWith('/campaigns/1-test-campaign/')),
    ).toBe(true)
  })

  it('Should not check the abilities without a campaign', async () => {
    data.value = undefined

    const { page } = await mountPage()

    expect(allows).not.toHaveBeenCalled()
    expect(page.props('isAdmin')).toBe(false)
    expect(page.props('isOwner')).toBe(false)
  })

  it('Should disable the tabs while the campaign is pending', async () => {
    isPending.value = true

    const { component } = await mountPage()

    expect(component.findComponent(TabStub).props('disabled')).toBe(true)
  })

  it('Should pass the campaign and the permissions to the child page', async () => {
    grant({ admin: true, owner: true })

    const { page } = await mountPage()

    expect(page.props('current')).toEqual(mockCampaignFull)
    expect(page.props('campaignId')).toBe(1)
    expect(page.props('isAdmin')).toBe(true)
    expect(page.props('isOwner')).toBe(true)
  })

  it('Should tell the child page that it may fetch once nuxt is ready', async () => {
    const { page } = await mountPage()

    expect(page.props('fetchReady')).toBe(true)
  })

  it('Should show the error state instead of the child page when the query fails', async () => {
    isError.value = true

    const { component } = await mountPage()

    expect(component.find('[test-id="page"]').exists()).toBe(false)
    expect(component.get('[test-id="error"]').text()).toContain(
      'general.error.text',
    )
  })

  it('Should disable the tabs when the query fails', async () => {
    isError.value = true

    const { component } = await mountPage()

    expect(component.findComponent(TabStub).props('disabled')).toBe(true)
  })
})
