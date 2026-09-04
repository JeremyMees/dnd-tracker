import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TransferOwnershipModal from '~/components/modal/TransferOwnership.vue'
import {
  mockCampaignFull,
  mockProTeamMember,
  mockTeamMember,
} from '~~/test/fixtures/campaign'
import { submitForm } from '~~/test/nuxt/stubs/form'
import { selectOption } from '~~/test/nuxt/stubs/popover'

const { fetchMock, invalidateQueries, toast } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  invalidateQueries: vi.fn(),
  toast: vi.fn(),
}))

vi.mock('@tanstack/vue-query', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useQueryClient: () => ({ invalidateQueries }),
}))

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}))

mockNuxtImport('$fetch', () => fetchMock)

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

function requestBody() {
  return fetchMock.mock.calls[0]![1].body
}

describe('TransferOwnership modal', () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue(undefined)
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

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('Should post the campaign, new owner and role to the transfer endpoint', async () => {
    const component = await mountTransferOwnershipModal()

    await fillForm(component, 'Admin', mockProTeamMember.user.id)
    await submitForm(component)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/campaign/transfer-ownership',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(requestBody()).toEqual({
      campaign: current.id,
      user: mockProTeamMember.user.id,
      role: 'Admin',
    })
  })

  it('Should pass the Remove role through unchanged', async () => {
    const component = await mountTransferOwnershipModal()

    await fillForm(component, 'Remove', mockTeamMember.user.id)
    await submitForm(component)

    expect(requestBody()).toEqual({
      campaign: current.id,
      user: mockTeamMember.user.id,
      role: 'Remove',
    })
  })

  it('Should invalidate the campaign queries on success', async () => {
    const component = await mountTransferOwnershipModal()

    await fillForm(component, 'Remove', mockTeamMember.user.id)
    await submitForm(component)

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useCampaignDetail', current.id],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useCampaignListing'],
    })
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

  it('Should show the error the request reports and not emit', async () => {
    fetchMock.mockRejectedValue(new Error('Transfer failed'))

    const component = await mountTransferOwnershipModal()

    await fillForm(component, 'Remove', mockTeamMember.user.id)
    await submitForm(component)
    await nextTick()

    expect(component.get('[test-id="error"]').text()).toBe('Transfer failed')
    expect(toast).not.toHaveBeenCalled()
    expect(component.emitted('finished')).toBeFalsy()
  })
})
