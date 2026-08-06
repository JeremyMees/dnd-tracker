import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import UpdateCampaignSettings from '~/components/form/UpdateCampaignSettings.vue'
import { mockCampaignFull } from '~~/test/fixtures/campaign'
import { submitForm } from '~~/test/nuxt/stubs/form'

const { updateCampaign } = vi.hoisted(() => ({ updateCampaign: vi.fn() }))

vi.mock('~/queries/campaigns', () => ({
  useCampaignUpdate: () => ({ mutateAsync: updateCampaign }),
}))

function mountCampaignSettings({ withCurrent = true } = {}) {
  return mountSuspended(UpdateCampaignSettings, {
    props: {
      current: withCurrent ? mockCampaignFull : undefined,
      campaignId: mockCampaignFull.id,
    },
  })
}

function updateOptions() {
  return updateCampaign.mock.calls[0]![0]
}

describe('UpdateCampaignSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    updateCampaign.mockResolvedValue(undefined)
  })

  it('Should match snapshot', async () => {
    const component = await mountCampaignSettings()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the title field with an update button', async () => {
    const component = await mountCampaignSettings()

    expect(component.text()).toContain('components.inputs.titleLabel')
    expect(component.get('button[type="submit"]').text()).toBe(
      'pages.campaigns.update',
    )
  })

  it('Should prefill the title of the campaign', async () => {
    const component = await mountCampaignSettings()

    expect(
      component.get<HTMLInputElement>('input[name="title"]').element.value,
    ).toBe(mockCampaignFull.title)
  })

  it('Should start empty without a campaign', async () => {
    const component = await mountCampaignSettings({ withCurrent: false })

    expect(
      component.get<HTMLInputElement>('input[name="title"]').element.value,
    ).toBe('')
  })

  it('Should update the campaign with the new title', async () => {
    const component = await mountCampaignSettings()

    await component.get('input[name="title"]').setValue('The Lost Mine')
    await submitForm(component)

    expect(updateCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: 'The Lost Mine' },
        id: mockCampaignFull.id,
      }),
    )
  })

  it('Should not update when the title is too short', async () => {
    const component = await mountCampaignSettings()

    await component.get('input[name="title"]').setValue('ab')
    await submitForm(component)

    expect(updateCampaign).not.toHaveBeenCalled()
  })

  it('Should not update when the title is too long', async () => {
    const component = await mountCampaignSettings()

    await component.get('input[name="title"]').setValue('a'.repeat(31))
    await submitForm(component)

    expect(updateCampaign).not.toHaveBeenCalled()
  })

  it('Should show the error the mutation reports', async () => {
    const component = await mountCampaignSettings()

    await submitForm(component)

    updateOptions().onError('Update failed')
    await nextTick()

    expect(component.text()).toContain('Update failed')
  })
})
