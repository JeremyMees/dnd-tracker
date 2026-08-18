import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TransferOwnershipModal from '~/components/modal/TransferOwnership.vue'
import {
  mockCampaignFull,
  mockProTeamMember,
  mockTeamMember,
} from '~~/test/fixtures/campaign'
import { submitForm } from '~~/test/nuxt/stubs/form'
import { selectOption } from '~~/test/nuxt/stubs/popover'

const { createTeamMember, removeTeamMember, toast, updateCampaign } =
  vi.hoisted(() => ({
    createTeamMember: vi.fn(),
    removeTeamMember: vi.fn(),
    toast: vi.fn(),
    updateCampaign: vi.fn(),
  }))

vi.mock('~/queries/team-members', () => ({
  useTeamMemberCreate: () => ({ mutateAsync: createTeamMember }),
  useTeamMemberRemove: () => ({ mutateAsync: removeTeamMember }),
}))

vi.mock('~/queries/campaigns', () => ({
  useCampaignUpdate: () => ({ mutateAsync: updateCampaign }),
}))

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}))

const current = {
  ...mockCampaignFull,
  team: [mockTeamMember, mockProTeamMember],
}

function mountTransferOwnershipModal() {
  return mountSuspended(TransferOwnershipModal, { props: { current } })
}

async function fillForm(
  component: Awaited<ReturnType<typeof mountTransferOwnershipModal>>,
  role: string,
  userId: string,
) {
  await selectOption(component, role, { index: 0 })
  await selectOption(component, userId, { index: 1 })
  await component.get('[test-id="title"]').setValue(current.title)
}

function removeOptions() {
  return removeTeamMember.mock.calls[0]![0]
}

function updateOptions() {
  return updateCampaign.mock.calls[0]![0]
}

describe('TransferOwnership modal', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    createTeamMember.mockResolvedValue(undefined)
    removeTeamMember.mockResolvedValue(undefined)
    updateCampaign.mockResolvedValue(undefined)
  })

  it('Should match snapshot', async () => {
    const component = await mountTransferOwnershipModal()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the role and user selects with the title field', async () => {
    const component = await mountTransferOwnershipModal()

    expect(component.find('[test-id="role"]').exists()).toBe(true)
    expect(component.find('[test-id="user"]').exists()).toBe(true)
    expect(component.find('[test-id="title"]').exists()).toBe(true)
    expect(component.get('[test-id="submit"]').text()).toBe('actions.transfer')
  })

  it('Should not warn when the picked member has a pro subscription', async () => {
    const component = await mountTransferOwnershipModal()

    await selectOption(component, 'Admin', { index: 0 })
    await selectOption(component, mockProTeamMember.user.id, { index: 1 })

    expect(component.find('[test-id="free-warning"]').exists()).toBe(false)
  })

  it('Should warn when the picked member has a free subscription', async () => {
    const component = await mountTransferOwnershipModal()

    await selectOption(component, 'Admin', { index: 0 })
    await selectOption(component, mockTeamMember.user.id, { index: 1 })

    expect(component.get('[test-id="free-warning"]').text()).toBe(
      'components.transferOwnershipModal.free',
    )
  })

  it('Should not submit when the confirmation title does not match', async () => {
    const component = await mountTransferOwnershipModal()

    await selectOption(component, 'Admin', { index: 0 })
    await selectOption(component, mockProTeamMember.user.id, { index: 1 })
    await component.get('[test-id="title"]').setValue('Wrong title')
    await submitForm(component)

    expect(removeTeamMember).not.toHaveBeenCalled()
  })

  it('Should give the old owner the picked role when transferring to a pro member', async () => {
    const component = await mountTransferOwnershipModal()

    await fillForm(component, 'Admin', mockProTeamMember.user.id)
    await submitForm(component)

    expect(createTeamMember).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          role: 'Admin',
          user: current.createdBy.id,
          campaign: current.id,
        },
      }),
    )
  })

  it('Should not give the old owner a role when transferring to a free member', async () => {
    const component = await mountTransferOwnershipModal()

    await fillForm(component, 'Admin', mockTeamMember.user.id)
    await submitForm(component)

    expect(createTeamMember).not.toHaveBeenCalled()
  })

  it('Should not give the old owner a role when removing the new owner', async () => {
    const component = await mountTransferOwnershipModal()

    await fillForm(component, 'Remove', mockProTeamMember.user.id)
    await submitForm(component)

    expect(createTeamMember).not.toHaveBeenCalled()
  })

  it('Should remove the picked member and set them as the new owner', async () => {
    const component = await mountTransferOwnershipModal()

    await fillForm(component, 'Remove', mockTeamMember.user.id)
    await submitForm(component)

    expect(removeOptions()).toEqual(
      expect.objectContaining({
        member: mockTeamMember.id,
        campaign: current.id,
      }),
    )
    expect(updateOptions()).toEqual(
      expect.objectContaining({
        data: { createdBy: mockTeamMember.user.id },
        id: current.id,
      }),
    )
  })

  it('Should toast and emit finished and close on success', async () => {
    const component = await mountTransferOwnershipModal()

    await fillForm(component, 'Remove', mockTeamMember.user.id)
    await submitForm(component)

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'success' }),
    )
    expect(component.emitted('finished')).toBeTruthy()
    expect(component.emitted('close')).toBeTruthy()
  })

  it('Should show the error a mutation reports', async () => {
    const component = await mountTransferOwnershipModal()

    await fillForm(component, 'Remove', mockTeamMember.user.id)
    await submitForm(component)

    removeOptions().onError('Removal failed')
    await nextTick()

    expect(component.get('[test-id="error"]').text()).toBe('Removal failed')
  })
})
