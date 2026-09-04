import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import InviteMemberModal from '~/components/modal/InviteMember.vue'
import { mockCampaignFull, mockTeamMember } from '~~/test/fixtures/campaign'
import { authUser } from '~~/test/fixtures/auth-user'
import { submitForm } from '~~/test/nuxt/stubs/form'
import { selectOption } from '~~/test/nuxt/stubs/popover'

const { createJoinCampaignToken, fetchMock, invalidateQueries, toast } =
  vi.hoisted(() => ({
    createJoinCampaignToken: vi.fn(),
    fetchMock: vi.fn(),
    invalidateQueries: vi.fn(),
    toast: vi.fn(),
  }))

const lookup = vi.fn()

vi.mock('~/queries/team-members', () => ({
  useJoinTokenCreate: () => ({ mutateAsync: createJoinCampaignToken }),
}))

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}))

vi.mock('@tanstack/vue-query', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useQueryClient: () => ({
    query: (config: { queryFn: () => unknown }) => config.queryFn(),
    invalidateQueries,
  }),
}))

const user = ref<AuthUser>({ ...authUser, email: 'me@shire.com' })

mockNuxtImport('useAuthenticatedUser', () => () => user)
mockNuxtImport('$fetch', () => fetchMock)

const foundProfile = {
  id: 'p1',
  username: 'bilbo',
  avatar: 'avatar-url',
}

const foundEmail = 'bilbo@shire.com'

function mountInviteMemberModal(current = mockCampaignFull) {
  return mountSuspended(InviteMemberModal, { props: { current } })
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function search(component: VueWrapper, email: string): Promise<void> {
  await component.get('[test-id="search"]').setValue('')
  await component.get('[test-id="search"]').setValue(email)
  await wait(600)
  await flushPromises()
}

function tokenOptions() {
  return createJoinCampaignToken.mock.calls[0]![0]
}

describe('InviteMember modal', () => {
  beforeEach(() => {
    lookup.mockResolvedValue(null)
    createJoinCampaignToken.mockResolvedValue('join-token')
    fetchMock.mockImplementation((url: string) =>
      url === '/api/campaign/member-lookup' ? lookup() : undefined,
    )
  })

  it('Should match snapshot', async () => {
    const component = await mountInviteMemberModal()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the search field without a users form', async () => {
    const component = await mountInviteMemberModal()

    expect(component.find('[test-id="search"]').exists()).toBe(true)
    expect(component.find('[test-id="found-user"]').exists()).toBe(false)
    expect(component.find('[test-id="submit"]').exists()).toBe(false)
  })

  it('Should show an error for an invalid email', async () => {
    const component = await mountInviteMemberModal()

    await search(component, 'not-an-email')

    expect(component.get('[test-id="search-error"]').text()).toBe(
      'zod.invalidEmail',
    )
    expect(lookup).not.toHaveBeenCalled()
  })

  it('Should not invite yourself', async () => {
    const component = await mountInviteMemberModal()

    await search(component, user.value.email)

    expect(component.get('[test-id="search-error"]').text()).toBe(
      'components.inviteMember.errors.self',
    )
    expect(lookup).not.toHaveBeenCalled()
  })

  it('Should not invite someone already invited to the campaign', async () => {
    const current = {
      ...mockCampaignFull,
      join_campaign: [mockTeamMember],
    }
    const component = await mountInviteMemberModal(current)

    await search(component, mockTeamMember.user.email)

    expect(component.get('[test-id="search-error"]').text()).toBe(
      'components.inviteMember.errors.alreadyInvited',
    )
  })

  it('Should not invite someone already part of the team', async () => {
    const current = {
      ...mockCampaignFull,
      team: [mockTeamMember],
    }
    const component = await mountInviteMemberModal(current)

    await search(component, mockTeamMember.user.email)

    expect(component.get('[test-id="search-error"]').text()).toBe(
      'components.inviteMember.errors.alreadyAdded',
    )
  })

  it('Should not invite the campaign owner', async () => {
    const component = await mountInviteMemberModal()

    await search(component, mockCampaignFull.createdBy.email)

    expect(component.get('[test-id="search-error"]').text()).toBe(
      'components.inviteMember.errors.alreadyAdded',
    )
  })

  it('Should refuse a search once the team is full', async () => {
    const team = Array.from({ length: 9 }, (_, index) => ({
      ...mockTeamMember,
      id: index,
      user: {
        ...mockTeamMember.user,
        id: `${index}`,
        email: `p${index}@shire.com`,
      },
    }))
    const current = { ...mockCampaignFull, team }
    const component = await mountInviteMemberModal(current)

    await search(component, 'newcomer@shire.com')

    expect(component.get('[test-id="search-error"]').text()).toBe(
      'components.inviteMember.errors.maxMembers',
    )
  })

  it('Should not search for the same profile twice', async () => {
    lookup.mockResolvedValue(foundProfile)
    const component = await mountInviteMemberModal()

    await search(component, foundEmail)
    await search(component, foundEmail)

    expect(component.get('[test-id="search-error"]').text()).toBe(
      'components.inviteMember.errors.alreadySelected',
    )
  })

  it('Should add the found profile to the invite list', async () => {
    lookup.mockResolvedValue(foundProfile)
    const component = await mountInviteMemberModal()

    await search(component, foundEmail)

    const foundUser = component.get('[test-id="found-user"]')
    expect(foundUser.text()).toContain(foundProfile.username)
    expect(component.find('[test-id="submit"]').exists()).toBe(true)
  })

  it('Should look the address up through the campaign scoped route', async () => {
    lookup.mockResolvedValue(foundProfile)
    const component = await mountInviteMemberModal()

    await search(component, foundEmail)

    expect(fetchMock).toHaveBeenCalledWith('/api/campaign/member-lookup', {
      method: 'POST',
      body: { campaign: mockCampaignFull.id, email: foundEmail },
    })
  })

  it('Should show a cta to invite an email that has no profile', async () => {
    const component = await mountInviteMemberModal()

    await search(component, 'stranger@shire.com')

    expect(component.text()).toContain('components.inviteMember.errors.noUser')
    expect(component.find('[test-id="found-user"]').exists()).toBe(false)
  })

  it('Should invite an emailed stranger who has no profile', async () => {
    const component = await mountInviteMemberModal()

    await search(component, 'stranger@shire.com')
    await component.get('[test-id="invite-new"]').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/emails/campaign-invite-no-user',
      {
        method: 'POST',
        body: { campaignId: mockCampaignFull.id, email: 'stranger@shire.com' },
      },
    )
  })

  it('Should show the error message from the search', async () => {
    lookup.mockRejectedValue(new Error('Search failed'))
    const component = await mountInviteMemberModal()

    await search(component, 'oops@shire.com')

    expect(component.get('[test-id="search-error"]').text()).toBe(
      'Search failed',
    )
  })

  it('Should remove a found user from the invite list', async () => {
    lookup.mockResolvedValue(foundProfile)
    const component = await mountInviteMemberModal()

    await search(component, foundEmail)
    await component.get('[test-id="remove"]').trigger('click')

    expect(component.find('[test-id="found-user"]').exists()).toBe(false)
  })

  it('Should invite every found user with their picked role', async () => {
    lookup.mockResolvedValue(foundProfile)
    const component = await mountInviteMemberModal()

    await search(component, foundEmail)
    await selectOption(component, 'Admin')
    await submitForm(component)
    await flushPromises()

    expect(tokenOptions().data).toEqual(
      expect.objectContaining({
        user: foundProfile.id,
        role: 'Admin',
        campaign: mockCampaignFull.id,
      }),
    )
    expect(fetchMock).toHaveBeenCalledWith('/api/emails/campaign-invite', {
      method: 'POST',
      body: expect.objectContaining({
        campaignId: mockCampaignFull.id,
        userId: foundProfile.id,
      }),
    })
  })

  it('Should toast, invalidate and close after a successful invite', async () => {
    lookup.mockResolvedValue(foundProfile)
    const component = await mountInviteMemberModal()

    await search(component, foundEmail)
    await submitForm(component)
    await flushPromises()

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'success' }),
    )
    expect(invalidateQueries).toHaveBeenCalled()
    expect(component.emitted('close')).toBeTruthy()
  })

  it('Should show the error when creating the join token fails', async () => {
    lookup.mockResolvedValue(foundProfile)
    createJoinCampaignToken.mockImplementation(
      async ({ onError }: { onError: (message: string) => void }) => {
        onError('Invite failed')
      },
    )
    const component = await mountInviteMemberModal()

    await search(component, foundEmail)
    await submitForm(component)
    await flushPromises()

    expect(component.get('[test-id="error"]').text()).toBe('Invite failed')
    expect(component.emitted('close')).toBeFalsy()
  })
})
