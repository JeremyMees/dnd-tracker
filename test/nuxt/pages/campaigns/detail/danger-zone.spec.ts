import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DangerZone from '~/pages/campaigns/[id]-[title]/danger-zone.vue'
import { isCampaignOwner } from '~~/shared/utils/abilities'
import {
  campaignPageProps,
  mockCampaignFull,
  mockTeamMember,
} from '~~/test/fixtures/campaign'

const { ask, navigateTo, open, removeCampaign, toast, useSeo } = vi.hoisted(
  () => ({
    ask: vi.fn(),
    navigateTo: vi.fn(),
    open: vi.fn(),
    removeCampaign: vi.fn(),
    toast: vi.fn(),
    useSeo: vi.fn(),
  }),
)

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}))

vi.mock('~/queries/campaigns', () => ({
  useCampaignRemove: () => ({ mutateAsync: removeCampaign }),
}))

mockNuxtImport('useSeo', () => useSeo)
mockNuxtImport('navigateTo', () => navigateTo)
mockNuxtImport('useModal', () => () => ({ open }))
mockNuxtImport('useConfirm', () => () => ({ ask }))
mockNuxtImport('useRoute', () => () => ({
  params: { id: '1', title: 'test-campaign' },
  path: '/campaigns/1-test-campaign/danger-zone',
  fullPath: '/campaigns/1-test-campaign/danger-zone',
  query: {},
}))

const isOwner = ref(true)

const BouncerStub = defineComponent({
  props: ['ability', 'args'],
  setup(_props, { slots }) {
    return () => (isOwner.value ? slots.can?.() : slots.cannot?.())
  },
})

const stubs = { Bouncer: BouncerStub }

async function mountPage(overrides: { current?: CampaignFull } = {}) {
  const component = await mountSuspended(DangerZone, {
    props: {
      current: mockCampaignFull,
      campaignId: campaignPageProps.campaignId,
      ...overrides,
    },
    global: { stubs },
  })

  await flushPromises()

  return {
    component,
    async transfer() {
      await component.get('[test-id="transfer"]').trigger('click')
    },
    async remove() {
      await component.get('[test-id="delete"]').trigger('click')
    },
  }
}

function confirmCallback(): (confirmed: boolean) => Promise<void> {
  return ask.mock.calls[0]![1]
}

function removeOptions() {
  return removeCampaign.mock.calls[0]![0]
}

function modalEvents(): { finished: () => void } {
  return open.mock.calls[0]![0].events
}

describe('Campaign danger zone page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    isOwner.value = true

    removeCampaign.mockResolvedValue(undefined)
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Campaign danger zone')
  })

  it('Should check the actions against the owner of the campaign', async () => {
    const { component } = await mountPage()

    const bouncer = component.findComponent(BouncerStub)

    expect(bouncer.props('ability')).toBe(isCampaignOwner)
    expect(bouncer.props('args')).toEqual([mockCampaignFull])
  })

  it('Should show the transfer and delete actions to the owner', async () => {
    const { component } = await mountPage()

    expect(component.find('[test-id="transfer"]').exists()).toBe(true)
    expect(component.find('[test-id="delete"]').exists()).toBe(true)
    expect(component.find('[test-id="no-permission"]').exists()).toBe(false)
  })

  it('Should tell anybody else that they have no permission', async () => {
    isOwner.value = false

    const { component } = await mountPage()

    expect(component.find('[test-id="transfer"]').exists()).toBe(false)
    expect(component.find('[test-id="delete"]').exists()).toBe(false)
    expect(component.get('[test-id="no-permission"]').text()).toBe(
      'pages.campaign.danger.noPermission',
    )
  })

  it('Should show a loader while the campaign is not loaded', async () => {
    const { component } = await mountPage({ current: undefined })

    expect(component.find('[test-id="loader"]').exists()).toBe(true)
    expect(component.find('[test-id="transfer"]').exists()).toBe(false)
  })

  it('Should not allow transferring without a team', async () => {
    const { component } = await mountPage()

    expect(
      component.get('[test-id="transfer"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('Should allow transferring to a member of the team', async () => {
    const { component } = await mountPage({
      current: { ...mockCampaignFull, team: [mockTeamMember] },
    })

    expect(
      component.get('[test-id="transfer"]').attributes('disabled'),
    ).toBeUndefined()
  })

  it('Should open the transfer modal for the campaign', async () => {
    const current = { ...mockCampaignFull, team: [mockTeamMember] }

    const { transfer } = await mountPage({ current })

    await transfer()

    expect(open).toHaveBeenCalledWith({
      component: 'TransferOwnership',
      header: 'components.transferOwnershipModal.title',
      props: { current },
      events: { finished: expect.any(Function) },
    })
  })

  it('Should send the user to the encounters after the transfer', async () => {
    const { transfer } = await mountPage({
      current: { ...mockCampaignFull, team: [mockTeamMember] },
    })

    await transfer()

    modalEvents().finished()

    expect(navigateTo).toHaveBeenCalledWith(
      '/campaigns/1-test-campaign/encounters',
    )
  })

  it('Should ask for confirmation before removing the campaign', async () => {
    const { remove } = await mountPage()

    await remove()

    expect(ask).toHaveBeenCalledWith({}, expect.any(Function))
    expect(removeCampaign).not.toHaveBeenCalled()
  })

  it('Should remove the campaign when the confirmation is accepted', async () => {
    const { remove } = await mountPage()

    await remove()
    await confirmCallback()(true)

    expect(removeCampaign).toHaveBeenCalledWith(
      expect.objectContaining({ id: campaignPageProps.campaignId }),
    )
  })

  it('Should keep the campaign when the confirmation is declined', async () => {
    const { remove } = await mountPage()

    await remove()
    await confirmCallback()(false)

    expect(removeCampaign).not.toHaveBeenCalled()
  })

  it('Should send the user to the campaigns when the removal succeeds', async () => {
    const { remove } = await mountPage()

    await remove()
    await confirmCallback()(true)

    removeOptions().onSuccess()

    expect(navigateTo).toHaveBeenCalledWith('/campaigns')
  })

  it('Should toast when the removal fails', async () => {
    const { remove } = await mountPage()

    await remove()
    await confirmCallback()(true)

    removeOptions().onError()

    expect(navigateTo).not.toHaveBeenCalled()
    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'general.error.text',
      variant: 'destructive',
    })
  })
})
