import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EncounterModal from '~/components/modal/Encounter.vue'
import { authUser } from '~~/test/fixtures/auth-user'
import { mockEncounterItem } from '~~/test/fixtures/encounter'
import { submitForm } from '~~/test/nuxt/stubs/form'
import { selectOption } from '~~/test/nuxt/stubs/popover'

const { addEncounter, toast, updateEncounter } = vi.hoisted(() => ({
  addEncounter: vi.fn(),
  toast: vi.fn(),
  updateEncounter: vi.fn(),
}))

const campaigns = ref<{ id: number; title: string }[] | undefined>([
  { id: 1, title: 'The Sunless Citadel' },
  { id: 2, title: 'The Lost Mine' },
])
const isError = ref(false)

vi.mock('~/queries/encounters', () => ({
  useEncounterCreate: () => ({ mutateAsync: addEncounter }),
  useEncounterUpdate: () => ({ mutateAsync: updateEncounter }),
}))

vi.mock('~/queries/campaigns', () => ({
  useCampaignMinimalListing: () => ({ data: campaigns, isError }),
}))

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}))

const user = ref<AuthUser>({ ...authUser })

mockNuxtImport('useAuthenticatedUser', () => () => user)

const encounter = mockEncounterItem

function mountEncounterModal(
  props: { encounter?: EncounterItem; campaignId?: number } = {},
) {
  return mountSuspended(EncounterModal, { props })
}

function createOptions() {
  return addEncounter.mock.calls[0]![0]
}

function updateOptions() {
  return updateEncounter.mock.calls[0]![0]
}

async function selectCampaign(
  component: VueWrapper,
  value: number | 'none',
): Promise<void> {
  await selectOption(component, value)
}

describe('Encounter modal', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    campaigns.value = [
      { id: 1, title: 'The Sunless Citadel' },
      { id: 2, title: 'The Lost Mine' },
    ]
    isError.value = false

    addEncounter.mockResolvedValue(undefined)
    updateEncounter.mockResolvedValue(undefined)
  })

  it('Should match snapshot', async () => {
    const component = await mountEncounterModal()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should start empty without an encounter', async () => {
    const component = await mountEncounterModal()

    expect(
      component.get<HTMLInputElement>('[test-id="title"]').element.value,
    ).toBe('')
    expect(component.get('[test-id="submit"]').text()).toBe(
      'pages.encounters.add',
    )
  })

  it('Should prefill the title and campaign when editing an encounter', async () => {
    const component = await mountEncounterModal({ encounter })

    expect(
      component.get<HTMLInputElement>('[test-id="title"]').element.value,
    ).toBe(encounter.title)
    expect(component.get('[test-id="submit"]').text()).toBe(
      'pages.encounters.update',
    )
  })

  it('Should render the campaign select when no campaignId is given', async () => {
    const component = await mountEncounterModal()

    expect(component.find('[test-id="campaign"]').exists()).toBe(true)
  })

  it('Should hide the campaign select when a campaignId is given', async () => {
    const component = await mountEncounterModal({ campaignId: 1 })

    expect(component.find('[test-id="campaign"]').exists()).toBe(false)
  })

  it('Should keep the settings collapsed by default', async () => {
    const component = await mountEncounterModal()

    expect(component.get('[test-id="settings"]').attributes('style')).toContain(
      'display: none',
    )
  })

  it('Should expand the settings when the encounter already has modified settings', async () => {
    const component = await mountEncounterModal({
      encounter: {
        ...encounter,
        settings: { ...encounter.settings, modified: true },
      },
    })

    expect(component.get('[test-id="settings"]').isVisible()).toBe(true)
  })

  it('Should toggle the settings visibility on click', async () => {
    const component = await mountEncounterModal()

    await component.get('[test-id="settings-toggle"]').trigger('click')

    expect(component.get('[test-id="settings"]').isVisible()).toBe(true)

    await component.get('[test-id="settings-toggle"]').trigger('click')

    expect(component.get('[test-id="settings"]').attributes('style')).toContain(
      'display: none',
    )
  })

  it('Should create an encounter without a campaign', async () => {
    const component = await mountEncounterModal()

    await component.get('[test-id="title"]').setValue('Goblin Ambush')
    await selectCampaign(component, 'none')
    await submitForm(component)

    expect(addEncounter).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Goblin Ambush',
          campaign: null,
          rows: [],
        }),
      }),
    )
  })

  it('Should create an encounter with a selected campaign', async () => {
    const component = await mountEncounterModal()

    await component.get('[test-id="title"]').setValue('Goblin Ambush')
    await selectCampaign(component, 2)
    await submitForm(component)

    expect(addEncounter).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ campaign: 2 }),
      }),
    )
  })

  it('Should force the campaign to the given campaignId', async () => {
    const component = await mountEncounterModal({ campaignId: 5 })

    await component.get('[test-id="title"]').setValue('Goblin Ambush')
    await submitForm(component)

    expect(addEncounter).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ campaign: 5 }),
      }),
    )
  })

  it('Should update an existing encounter', async () => {
    const component = await mountEncounterModal({ encounter })

    await component.get('[test-id="title"]').setValue('Goblin Massacre')
    await submitForm(component)

    expect(updateEncounter).toHaveBeenCalledWith(
      expect.objectContaining({
        id: encounter.id,
        data: expect.objectContaining({ title: 'Goblin Massacre' }),
      }),
    )
    expect(addEncounter).not.toHaveBeenCalled()
  })

  it('Should mark the settings as modified on submit', async () => {
    const component = await mountEncounterModal()

    await component.get('[test-id="title"]').setValue('Goblin Ambush')
    await submitForm(component)

    expect(createOptions().data.settings).toEqual(
      expect.objectContaining({ modified: true }),
    )
  })

  it('Should emit close when the mutation succeeds', async () => {
    const component = await mountEncounterModal()

    await component.get('[test-id="title"]').setValue('Goblin Ambush')
    await submitForm(component)

    createOptions().onSuccess()

    expect(component.emitted('close')).toBeTruthy()
  })

  it('Should not submit when the title is too short', async () => {
    const component = await mountEncounterModal()

    await component.get('[test-id="title"]').setValue('ab')
    await submitForm(component)

    expect(addEncounter).not.toHaveBeenCalled()
  })

  it('Should show the error the mutation reports', async () => {
    const component = await mountEncounterModal()

    await component.get('[test-id="title"]').setValue('Goblin Ambush')
    await submitForm(component)

    createOptions().onError('Create failed')
    await nextTick()

    expect(component.get('[test-id="error"]').text()).toBe('Create failed')
  })

  it('Should show the error an update reports', async () => {
    const component = await mountEncounterModal({ encounter })

    await submitForm(component)

    updateOptions().onError('Update failed')
    await nextTick()

    expect(component.get('[test-id="error"]').text()).toBe('Update failed')
  })

  it('Should toast and close when the campaign listing errors', async () => {
    const component = await mountEncounterModal()

    isError.value = true
    await flushPromises()

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'destructive' }),
    )
    expect(component.emitted('close')).toBeTruthy()
  })
})
