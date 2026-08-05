import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Settings from '~/pages/campaigns/[id]-[title]/settings.vue'
import { authUser } from '~~/test/fixtures/auth-user'
import {
  campaignPageProps,
  mockCampaignFull,
  mockInvitedMember,
  mockTeamMember,
} from '~~/test/fixtures/campaign'

const {
  ask,
  navigateTo,
  open,
  removeJoinCampaignToken,
  removeTeamMember,
  toast,
  useSeo,
} = vi.hoisted(() => ({
  ask: vi.fn(),
  navigateTo: vi.fn(),
  open: vi.fn(),
  removeJoinCampaignToken: vi.fn(),
  removeTeamMember: vi.fn(),
  toast: vi.fn(),
  useSeo: vi.fn(),
}))

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}))

vi.mock('~~/queries/team-members', () => ({
  useTeamMemberRemove: () => ({ mutateAsync: removeTeamMember }),
  useJoinTokenRemove: () => ({ mutateAsync: removeJoinCampaignToken }),
}))

const user = ref<AuthUser>({ ...authUser })

mockNuxtImport('useSeo', () => useSeo)
mockNuxtImport('navigateTo', () => navigateTo)
mockNuxtImport('useAuthenticatedUser', () => () => user)
mockNuxtImport('useModal', () => () => ({ open }))
mockNuxtImport('useConfirm', () => () => ({ ask }))

const RoleFormStub = defineComponent({
  props: ['member', 'campaignId'],
  template: '<div data-test-role />',
})

const CampaignFormStub = defineComponent({
  props: ['current', 'campaignId'],
  template: '<div data-test-campaign-form />',
})

const stubs = {
  FormRoleUpdate: RoleFormStub,
  FormUpdateCampaignSettings: CampaignFormStub,
  SkeletonMemberRow: { template: '<div data-test-member-loader />' },
  SkeletonInput: { template: '<div data-test-input-loader />' },
}

const self = {
  ...mockTeamMember,
  id: 9,
  user: { ...mockTeamMember.user, id: authUser.id },
}

async function mountPage(overrides: { current?: CampaignFull } = {}) {
  const component = await mountSuspended(Settings, {
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
    get members() {
      return component.findAll('[data-test-member]')
    },
    async removeMember(index: number) {
      await component.findAll('[data-test-remove]')[index]!.trigger('click')
    },
    async invite() {
      await component.get('[data-test-invite]').trigger('click')
    },
  }
}

function confirmCallback(): (confirmed: boolean) => Promise<void> {
  return ask.mock.calls[0]![1]
}

function removeOptions() {
  return removeTeamMember.mock.calls[0]![0]
}

describe('Campaign settings page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    user.value = { ...authUser }

    removeTeamMember.mockResolvedValue(undefined)
    removeJoinCampaignToken.mockResolvedValue(undefined)
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Campaign settings')
  })

  it('Should list the owner, the team and the invites', async () => {
    const { component, members } = await mountPage({
      current: {
        ...mockCampaignFull,
        team: [mockTeamMember],
        join_campaign: [mockInvitedMember],
      },
    })

    expect(members).toHaveLength(3)
    expect(members[0]!.text()).toContain(mockCampaignFull.createdBy.username)
    expect(members[0]!.get('[data-test-owner]').text()).toBe(
      'general.roles.Owner.title',
    )
    expect(members[1]!.text()).toContain(mockTeamMember.user.username)
    expect(members[2]!.get('[data-test-invited]').text()).toContain(
      'general.invited',
    )
    expect(component.findAllComponents(RoleFormStub)).toHaveLength(1)
  })

  it('Should let a member of the team change roles', async () => {
    const { component } = await mountPage({
      current: {
        ...mockCampaignFull,
        team: [mockTeamMember],
      },
    })

    const form = component.findComponent(RoleFormStub)

    expect(form.props('member')).toEqual(mockTeamMember)
    expect(form.props('campaignId')).toBe(campaignPageProps.campaignId)
  })

  it('Should never remove the owner', async () => {
    const { component } = await mountPage()

    expect(
      component.get('[data-test-remove]').attributes('disabled'),
    ).toBeDefined()
  })

  it('Should show loaders while the campaign is not loaded', async () => {
    const { component, members } = await mountPage({ current: undefined })

    expect(members).toHaveLength(0)
    expect(component.findAll('[data-test-member-loader]')).toHaveLength(3)
    expect(component.findAll('[data-test-input-loader]')).toHaveLength(1)
  })

  it('Should render the campaign form with the campaign', async () => {
    const { component } = await mountPage()

    const form = component.findComponent(CampaignFormStub)

    expect(form.props('current')).toEqual(mockCampaignFull)
    expect(form.props('campaignId')).toBe(mockCampaignFull.id)
  })

  it('Should open the invite modal for the campaign', async () => {
    const { invite } = await mountPage()

    await invite()

    expect(open).toHaveBeenCalledWith({
      component: 'InviteMember',
      header: 'components.inviteMember.title',
      props: { current: mockCampaignFull },
    })
  })

  it('Should not allow inviting when the campaign is full', async () => {
    const team = Array.from({ length: 9 }, (_, index) => ({
      ...mockTeamMember,
      id: index + 1,
      user: { ...mockTeamMember.user, id: `member-${index}` },
    }))

    const { component } = await mountPage({
      current: { ...mockCampaignFull, team },
    })

    expect(
      component.get('[data-test-invite]').attributes('disabled'),
    ).toBeDefined()
  })

  it('Should ask before removing a member of the team', async () => {
    const { removeMember } = await mountPage({
      current: {
        ...mockCampaignFull,
        team: [mockTeamMember],
      },
    })

    await removeMember(1)

    expect(ask).toHaveBeenCalledWith(
      {
        title: 'pages.campaign.settings.dialog.remove.title',
        description: 'pages.campaign.settings.dialog.remove.text',
      },
      expect.any(Function),
    )
    expect(removeTeamMember).not.toHaveBeenCalled()
  })

  it('Should remove the member when the confirmation is accepted', async () => {
    const { removeMember } = await mountPage({
      current: {
        ...mockCampaignFull,
        team: [mockTeamMember],
      },
    })

    await removeMember(1)
    await confirmCallback()(true)

    expect(removeTeamMember).toHaveBeenCalledWith(
      expect.objectContaining({
        member: mockTeamMember.id,
        campaign: campaignPageProps.campaignId,
      }),
    )
  })

  it('Should keep the member when the confirmation is declined', async () => {
    const { removeMember } = await mountPage({
      current: {
        ...mockCampaignFull,
        team: [mockTeamMember],
      },
    })

    await removeMember(1)
    await confirmCallback()(false)

    expect(removeTeamMember).not.toHaveBeenCalled()
  })

  it('Should stay on the page when another member is removed', async () => {
    const { removeMember } = await mountPage({
      current: {
        ...mockCampaignFull,
        team: [mockTeamMember],
      },
    })

    await removeMember(1)
    await confirmCallback()(true)

    removeOptions().onSuccess()

    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('Should ask to leave when the user removes themselves', async () => {
    const { removeMember } = await mountPage({
      current: {
        ...mockCampaignFull,
        team: [self],
      },
    })

    await removeMember(1)

    expect(ask).toHaveBeenCalledWith(
      {
        title: 'pages.campaign.settings.dialog.leave.title',
        description: 'pages.campaign.settings.dialog.leave.text',
      },
      expect.any(Function),
    )
  })

  it('Should send the user to the campaigns after leaving', async () => {
    const { removeMember } = await mountPage({
      current: {
        ...mockCampaignFull,
        team: [self],
      },
    })

    await removeMember(1)
    await confirmCallback()(true)

    removeOptions().onSuccess()

    expect(navigateTo).toHaveBeenCalledWith('/campaigns')
  })

  it('Should toast when removing a member fails', async () => {
    const { removeMember } = await mountPage({
      current: {
        ...mockCampaignFull,
        team: [mockTeamMember],
      },
    })

    await removeMember(1)
    await confirmCallback()(true)

    removeOptions().onError()

    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'general.error.text',
      variant: 'destructive',
    })
  })

  it('Should revoke the token of an invited member instead', async () => {
    const { removeMember } = await mountPage({
      current: {
        ...mockCampaignFull,
        join_campaign: [mockInvitedMember],
      },
    })

    await removeMember(1)
    await confirmCallback()(true)

    expect(removeJoinCampaignToken).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockInvitedMember.id,
        campaign: campaignPageProps.campaignId,
      }),
    )
    expect(removeTeamMember).not.toHaveBeenCalled()
  })
})
