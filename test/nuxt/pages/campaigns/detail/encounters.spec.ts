import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CampaignEncounters from '~/pages/campaigns/[id]-[title]/encounters.vue'
import { mockCampaignFull } from '~~/test/fixtures/campaign'

const { useSeo } = vi.hoisted(() => ({ useSeo: vi.fn() }))

mockNuxtImport('useSeo', () => useSeo)

vi.mock('~/components/templates/Encounters.vue', () => ({
  default: {
    name: 'EncountersStub',
    props: { campaignId: Number, fetchReady: Boolean },
    template: '<div test-id="encounters" />',
  },
}))

const encounters = { name: 'EncountersStub' }

const props = {
  current: mockCampaignFull,
  campaignId: 1,
  isAdmin: true,
  isOwner: true,
  fetchReady: true,
}

function mountPage(overrides: Partial<typeof props> = {}) {
  return mountSuspended(CampaignEncounters, {
    props: { ...props, ...overrides },
  })
}

describe('Campaign encounters page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Campaign encounters')
  })

  it('Should render the encounters listing', async () => {
    const component = await mountPage()

    expect(component.find('[test-id="encounters"]').exists()).toBe(true)
  })

  it('Should scope the listing to the campaign', async () => {
    const component = await mountPage()

    expect(component.findComponent(encounters).props('campaignId')).toBe(1)
  })

  it('Should hold the listing back until the parent page is ready', async () => {
    const component = await mountPage({ fetchReady: false })

    expect(component.findComponent(encounters).props('fetchReady')).toBe(false)
  })

  it('Should let the listing fetch once the parent page is ready', async () => {
    const component = await mountPage()

    expect(component.findComponent(encounters).props('fetchReady')).toBe(true)
  })
})
