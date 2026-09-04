import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CampaignModal from '~/components/modal/Campaign.vue'
import { mockCampaignItem } from '~~/test/fixtures/campaign'
import { authUser } from '~~/test/fixtures/auth-user'
import { submitForm } from '~~/test/nuxt/stubs/form'

const { createCampaign, updateCampaign } = vi.hoisted(() => ({
  createCampaign: vi.fn(),
  updateCampaign: vi.fn(),
}))

vi.mock('~/queries/campaigns', () => ({
  useCampaignCreate: () => ({ mutateAsync: createCampaign }),
  useCampaignUpdate: () => ({ mutateAsync: updateCampaign }),
}))

const user = ref<AuthUser>({ ...authUser })

mockNuxtImport('useAuthenticatedUser', () => () => user)

function mountCampaignModal(campaign?: CampaignItem) {
  return mountSuspended(CampaignModal, { props: { campaign } })
}

function createOptions() {
  return createCampaign.mock.calls[0]![0]
}

function updateOptions() {
  return updateCampaign.mock.calls[0]![0]
}

describe('Campaign modal', () => {
  beforeEach(() => {
    createCampaign.mockResolvedValue(undefined)
    updateCampaign.mockResolvedValue(undefined)
  })

  it('Should match snapshot', async () => {
    const component = await mountCampaignModal()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should start empty without a campaign', async () => {
    const component = await mountCampaignModal()

    expect(
      component.get<HTMLInputElement>('[test-id="title"]').element.value,
    ).toBe('')
    expect(component.get('[test-id="submit"]').text()).toBe(
      'pages.campaigns.add',
    )
  })

  it('Should prefill the title when editing a campaign', async () => {
    const component = await mountCampaignModal(mockCampaignItem)

    expect(
      component.get<HTMLInputElement>('[test-id="title"]').element.value,
    ).toBe(mockCampaignItem.title)
    expect(component.get('[test-id="submit"]').text()).toBe(
      'pages.campaigns.update',
    )
  })

  it('Should create a campaign for the current user', async () => {
    const component = await mountCampaignModal()

    await component.get('[test-id="title"]').setValue('The Lost Mine')
    await submitForm(component)

    expect(createCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: 'The Lost Mine', createdBy: user.value.id },
      }),
    )
    expect(updateCampaign).not.toHaveBeenCalled()
  })

  it('Should update an existing campaign', async () => {
    const component = await mountCampaignModal(mockCampaignItem)

    await component.get('[test-id="title"]').setValue('The Lost Mine')
    await submitForm(component)

    expect(updateCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: 'The Lost Mine' },
        id: mockCampaignItem.id,
      }),
    )
    expect(createCampaign).not.toHaveBeenCalled()
  })

  it('Should emit close when the mutation succeeds', async () => {
    const component = await mountCampaignModal()

    await component.get('[test-id="title"]').setValue('The Lost Mine')
    await submitForm(component)

    createOptions().onSuccess()

    expect(component.emitted('close')).toBeTruthy()
  })

  it('Should not submit when the title is too short', async () => {
    const component = await mountCampaignModal()

    await component.get('[test-id="title"]').setValue('ab')
    await submitForm(component)

    expect(createCampaign).not.toHaveBeenCalled()
  })

  it('Should not submit when the title is too long', async () => {
    const component = await mountCampaignModal()

    await component.get('[test-id="title"]').setValue('a'.repeat(31))
    await submitForm(component)

    expect(createCampaign).not.toHaveBeenCalled()
  })

  it('Should show the error the mutation reports', async () => {
    const component = await mountCampaignModal()

    await component.get('[test-id="title"]').setValue('The Lost Mine')
    await submitForm(component)

    createOptions().onError('Create failed')
    await nextTick()

    expect(component.get('[test-id="error"]').text()).toBe('Create failed')
  })

  it('Should show the error an update reports', async () => {
    const component = await mountCampaignModal(mockCampaignItem)

    await component.get('[test-id="title"]').setValue('The Lost Mine')
    await submitForm(component)

    updateOptions().onError('Update failed')
    await nextTick()

    expect(component.get('[test-id="error"]').text()).toBe('Update failed')
  })
})
