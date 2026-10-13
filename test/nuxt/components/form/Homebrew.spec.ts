import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Homebrew from '~/components/form/Homebrew.vue'
import { homebrewType } from '~~/constants/validation'
import { authUser } from '~~/test/fixtures/auth-user'
import { mockCampaignFull } from '~~/test/fixtures/campaign'
import { mockHomebrewItem } from '~~/test/fixtures/homebrew'
import { dndMonsterFixture } from '~~/test/fixtures/open5e'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { submitForm } from '~~/test/nuxt/stubs/form'
import { selectOption } from '~~/test/nuxt/stubs/popover'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

const {
  createHomebrew,
  updateHomebrew,
  currentUser,
  homebrewCount,
  homebrewCountEnabled,
} = vi.hoisted(() => ({
  createHomebrew: vi.fn(),
  updateHomebrew: vi.fn(),
  currentUser: { value: null as { id: string } | null },
  homebrewCount: { value: 0 },
  homebrewCountEnabled: { value: undefined as boolean | undefined },
}))

vi.mock('~/queries/homebrews', () => ({
  useHomebrewCreate: () => ({ mutateAsync: createHomebrew }),
  useHomebrewUpdate: () => ({ mutateAsync: updateHomebrew }),
  useHomebrewCount: (_id: number, enabled: { value: boolean }) => {
    homebrewCountEnabled.value = enabled.value

    return { data: homebrewCount }
  },
}))

mockNuxtImport('useAuthentication', () => () => ({ user: currentUser }))

mockNuxtImport('useI18n', () => () => ({
  t: (key: string, params?: unknown) =>
    params && typeof params === 'object'
      ? `${key} ${Object.values(params).join(' ')}`
      : key,
  locale: { value: 'en' },
}))

const update = vi.fn()

const FormBestiaryStub = defineComponent({
  props: { addable: Boolean, persist: String },
  emits: ['remix'],
  template: '<div test-id="bestiary" />',
})

const ownedCampaign: NonNullable<InitiativeSheet['campaign']> = {
  id: mockCampaignFull.id,
  title: mockCampaignFull.title,
  createdBy: {
    id: authUser.id,
    username: authUser.username,
    avatar: authUser.avatar,
  },
  team: [],
}

interface MountOptions {
  campaignId?: number
  item?: HomebrewItemRow
  row?: InitiativeSheetRow
  template?: Partial<InitiativeSheetRow> & { name: string }
  isEncounter?: boolean
  withSheet?: boolean
  rows?: InitiativeSheetRow[]
  campaign?: InitiativeSheet['campaign'] | null
}

function mountHomebrew({
  campaignId,
  item,
  row,
  template,
  isEncounter = false,
  withSheet = false,
  rows = sheet.rows,
  campaign = ownedCampaign,
}: MountOptions = {}) {
  return mountWithTooltips(Homebrew, {
    props: {
      campaignId,
      item,
      row,
      template,
      isEncounter,
      sheet: withSheet
        ? { ...sheet, rows, campaign: campaign ?? undefined }
        : undefined,
      update: withSheet ? update : undefined,
    },
    global: { stubs: { FormBestiary: FormBestiaryStub } },
  })
}

async function fillName(
  component: Awaited<ReturnType<typeof mountHomebrew>>,
  name = 'Grommash',
) {
  await component.get('input[name="name"]').setValue(name)
  await flushPromises()
}

const invalidAction: DndAction = {
  actionType: 'bonusAction',
  name: '',
  desc: '',
  attacks: [],
}

function createOptions() {
  return createHomebrew.mock.calls[0]![0]
}

function updateOptions() {
  return updateHomebrew.mock.calls[0]![0]
}

describe('Homebrew', () => {
  beforeEach(() => {
    currentUser.value = { id: authUser.id }
    homebrewCount.value = 0
    createHomebrew.mockResolvedValue(undefined)
    updateHomebrew.mockResolvedValue(undefined)
    update.mockResolvedValue(undefined)
  })

  it('Should match snapshot', async () => {
    const component = await mountHomebrew()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the four tabs with info selected', async () => {
    const component = await mountHomebrew()

    const tabs = component.findAll('[role="tab"]')

    expect(tabs).toHaveLength(4)
    expect(tabs[0]!.attributes('aria-selected')).toBe('true')
  })

  it('Should not go back from the first tab when editing', async () => {
    const component = await mountHomebrew({ item: mockHomebrewItem })

    expect(
      component.get('[test-id="prev"]').attributes('disabled'),
    ).toBeDefined()
    expect(
      component.get('[test-id="next"]').attributes('disabled'),
    ).toBeUndefined()
  })

  it('Should walk forward through the tabs', async () => {
    const component = await mountHomebrew()

    await component.get('[test-id="next"]').trigger('click')
    await nextTick()

    expect(
      component.findAll('[role="tab"]')[1]!.attributes('aria-selected'),
    ).toBe('true')
  })

  it('Should not go forward from the last tab', async () => {
    const component = await mountHomebrew()

    for (let i = 0; i < 3; i++) {
      await component.get('[test-id="next"]').trigger('click')
      await nextTick()
    }

    expect(
      component.get('[test-id="next"]').attributes('disabled'),
    ).toBeDefined()
    expect(
      component.get('[test-id="prev"]').attributes('disabled'),
    ).toBeUndefined()
  })

  it('Should walk back through the tabs', async () => {
    const component = await mountHomebrew()

    await component.get('[test-id="next"]').trigger('click')
    await nextTick()
    await component.get('[test-id="prev"]').trigger('click')
    await nextTick()

    expect(
      component.findAll('[role="tab"]')[0]!.attributes('aria-selected'),
    ).toBe('true')
  })

  it('Should prefill the form from the given item', async () => {
    const component = await mountHomebrew({ item: mockHomebrewItem })

    expect(
      component.get<HTMLInputElement>('input[name="name"]').element.value,
    ).toBe(mockHomebrewItem.name)
  })

  it('Should not submit without a valid name', async () => {
    const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

    await fillName(component, 'ab')
    await submitForm(component)

    expect(createHomebrew).not.toHaveBeenCalled()
  })

  it('Should accept names up to 50 characters', async () => {
    const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

    await fillName(component, 'A'.repeat(51))
    await submitForm(component)

    expect(createHomebrew).not.toHaveBeenCalled()

    await fillName(component, 'A'.repeat(50))
    await submitForm(component)

    expect(createHomebrew).toHaveBeenCalledOnce()
  })

  it('Should say which tab has the invalid field when saving fails', async () => {
    const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

    await fillName(component, 'ab')
    await submitForm(component)

    expect(component.get('[test-id="form-error"]').text()).toBe(
      'components.homebrewModal.invalid general.info',
    )
    expect(
      component.findAll('[role="tab"]')[0]!.attributes('aria-selected'),
    ).toBe('true')
  })

  it('Should switch to the tab with the invalid field when saving fails', async () => {
    const component = await mountHomebrew({
      item: { ...mockHomebrewItem, actions: [invalidAction] },
    })

    await submitForm(component)

    expect(component.get('[test-id="form-error"]').text()).toBe(
      'components.homebrewModal.invalid general.action',
    )
    expect(
      component.findAll('[role="tab"]')[3]!.attributes('aria-selected'),
    ).toBe('true')
    expect(updateHomebrew).not.toHaveBeenCalled()
  })

  it('Should stay on the current tab when it is one of the invalid tabs', async () => {
    const component = await mountHomebrew({
      item: { ...mockHomebrewItem, actions: [invalidAction] },
    })

    await fillName(component, 'ab')
    await submitForm(component)

    expect(component.get('[test-id="form-error"]').text()).toBe(
      'components.homebrewModal.invalid general.info and general.action',
    )
    expect(
      component.findAll('[role="tab"]')[0]!.attributes('aria-selected'),
    ).toBe('true')
  })

  it('Should clear the invalid message once the form saves', async () => {
    const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

    await fillName(component, 'ab')
    await submitForm(component)
    await fillName(component)
    await submitForm(component)

    expect(component.find('[test-id="form-error"]').exists()).toBe(false)
    expect(createHomebrew).toHaveBeenCalled()
  })

  it('Should create a homebrew for the campaign', async () => {
    const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

    await fillName(component)
    await submitForm(component)

    expect(createHomebrew).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Grommash',
          type: 'player',
          campaign: mockCampaignFull.id,
        }),
      }),
    )
  })

  it('Should update the homebrew when editing an existing item', async () => {
    const component = await mountHomebrew({ item: mockHomebrewItem })

    await fillName(component, 'Renamed Boss')
    await submitForm(component)

    expect(updateHomebrew).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Renamed Boss' }),
        id: mockHomebrewItem.id,
      }),
    )
    expect(createHomebrew).not.toHaveBeenCalled()
  })

  it('Should emit close after a successful save', async () => {
    const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

    await fillName(component)
    await submitForm(component)

    expect(component.emitted('close')).toHaveLength(1)
  })

  it('Should show the error the mutation reports', async () => {
    const component = await mountHomebrew({ item: mockHomebrewItem })

    await fillName(component)
    await submitForm(component)

    updateOptions().onError('Save failed')
    await nextTick()

    expect(component.text()).toContain('Save failed')
  })

  it('Should add the homebrew to the sheet instead of saving it', async () => {
    const component = await mountHomebrew({ withSheet: true })

    await fillName(component)
    await submitForm(component)

    const rows = update.mock.calls[0]![0].rows

    expect(rows).toHaveLength(sheet.rows.length + 1)
    expect(rows.at(-1)!.name).toBe('Grommash')
    expect(createHomebrew).not.toHaveBeenCalled()
  })

  it('Should close after adding the homebrew to the sheet', async () => {
    const component = await mountHomebrew({ withSheet: true })

    await fillName(component)
    await submitForm(component)

    expect(component.emitted('close')).toHaveLength(1)
  })

  it('Should not offer to save to the campaign outside an encounter', async () => {
    const component = await mountHomebrew({ withSheet: true })

    expect(component.find('#saveToCampaign').exists()).toBeFalsy()
  })

  it('Should offer to save to the campaign inside an encounter', async () => {
    const component = await mountHomebrew({
      withSheet: true,
      isEncounter: true,
      campaignId: mockCampaignFull.id,
    })

    expect(
      component.get('#saveToCampaign').attributes('disabled'),
    ).toBeUndefined()
    expect(component.text()).toContain('components.homebrewModal.save')
  })

  it('Should offer to save to the campaign to an admin', async () => {
    const component = await mountHomebrew({
      withSheet: true,
      isEncounter: true,
      campaignId: mockCampaignFull.id,
      campaign: {
        ...ownedCampaign,
        createdBy: { ...ownedCampaign.createdBy, id: 'someone-else' },
        team: [
          {
            id: 1,
            role: 'Admin',
            user: {
              id: authUser.id,
              username: authUser.username,
              avatar: authUser.avatar,
            },
          },
        ],
      },
    })

    expect(component.find('#saveToCampaign').exists()).toBe(true)
  })

  it('Should not offer to save to the campaign to a plain member', async () => {
    const component = await mountHomebrew({
      withSheet: true,
      isEncounter: true,
      campaignId: mockCampaignFull.id,
      campaign: {
        ...ownedCampaign,
        createdBy: { ...ownedCampaign.createdBy, id: 'someone-else' },
        team: [
          {
            id: 1,
            role: 'Viewer',
            user: {
              id: authUser.id,
              username: authUser.username,
              avatar: authUser.avatar,
            },
          },
        ],
      },
    })

    expect(component.find('#saveToCampaign').exists()).toBe(false)
  })

  it('Should not offer to save to the campaign on a personal encounter', async () => {
    const component = await mountHomebrew({
      withSheet: true,
      isEncounter: true,
      campaign: null,
    })

    expect(component.find('#saveToCampaign').exists()).toBe(false)
  })

  it('Should not offer to save to the campaign without a signed in user', async () => {
    currentUser.value = null

    const component = await mountHomebrew({
      withSheet: true,
      isEncounter: true,
      campaignId: mockCampaignFull.id,
    })

    expect(component.find('#saveToCampaign').exists()).toBe(false)
  })

  it('Should also save to the campaign when the switch is on', async () => {
    const component = await mountHomebrew({
      withSheet: true,
      isEncounter: true,
      campaignId: mockCampaignFull.id,
    })

    await component.get('#saveToCampaign').trigger('click')
    await fillName(component)
    await submitForm(component)

    expect(update).toHaveBeenCalled()
    expect(createHomebrew).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ campaign: mockCampaignFull.id }),
      }),
    )
  })

  it('Should link the added rows to the new campaign homebrew', async () => {
    createHomebrew.mockResolvedValue(42)

    const component = await mountHomebrew({
      withSheet: true,
      isEncounter: true,
      campaignId: mockCampaignFull.id,
    })

    await component.get('#saveToCampaign').trigger('click')
    await fillName(component)
    await submitForm(component)

    const rows: InitiativeSheetRow[] = update.mock.calls[0]![0].rows
    const added = rows.find(row => row.name === 'Grommash')

    expect(added?.homebrew).toBe(42)
    expect(component.emitted('close')).toHaveLength(1)
  })

  it('Should not add rows when saving to the campaign fails', async () => {
    createHomebrew.mockRejectedValue(new Error('boom'))

    const component = await mountHomebrew({
      withSheet: true,
      isEncounter: true,
      campaignId: mockCampaignFull.id,
    })

    await component.get('#saveToCampaign').trigger('click')
    await fillName(component)
    await submitForm(component)

    expect(update).not.toHaveBeenCalled()
    expect(component.emitted('close')).toBeUndefined()
  })

  it('Should not link rows that are not saved to the campaign', async () => {
    const component = await mountHomebrew({
      withSheet: true,
      isEncounter: true,
      campaignId: mockCampaignFull.id,
    })

    await fillName(component)
    await submitForm(component)

    const rows: InitiativeSheetRow[] = update.mock.calls[0]![0].rows
    const added = rows.find(row => row.name === 'Grommash')

    expect(added).toBeDefined()
    expect(added!.homebrew).toBeUndefined()
    expect(createHomebrew).not.toHaveBeenCalled()
  })

  it('Should not submit with an invalid hit dice expression', async () => {
    const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

    await fillName(component)
    await component.get('[test-id="advanced-toggle"]').trigger('click')
    await nextTick()
    await component.get('input[name="hitDice"]').setValue('2x6')
    await submitForm(component)

    expect(createHomebrew).not.toHaveBeenCalled()
    expect(component.text()).toContain('zod.hitDiceExpression')
  })

  it('Should require an amount for a monster in an encounter', async () => {
    const component = await mountHomebrew({
      withSheet: true,
      isEncounter: true,
    })

    await fillName(component)
    await selectOption(component, 'monster', { index: 0 })
    await nextTick()
    await submitForm(component)

    expect(update).not.toHaveBeenCalled()
    expect(component.text()).toContain('zod.required')
  })

  it('Should require a summoner for a summon in an encounter', async () => {
    const component = await mountHomebrew({
      withSheet: true,
      isEncounter: true,
    })

    await fillName(component)
    await selectOption(component, 'summon', { index: 0 })
    await nextTick()
    await component.get('input[name="amount"]').setValue(1)
    await submitForm(component)

    expect(update).not.toHaveBeenCalled()
    expect(component.text()).toContain('zod.required')
  })

  it('Should not close when the update handler is missing', async () => {
    const component = await mountWithTooltips(Homebrew, {
      props: {
        sheet: { ...sheet },
        update: undefined,
      },
    })

    await fillName(component)
    await submitForm(component)

    expect(component.emitted('close')).toBeUndefined()
  })

  it('Should not close when the campaign homebrew could not be saved', async () => {
    createHomebrew.mockRejectedValue(new Error('boom'))

    const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

    await fillName(component)
    await submitForm(component)

    expect(component.emitted('close')).toBeUndefined()
  })

  it('Should attach the picked summoner to the new row', async () => {
    const component = await mountHomebrew({ withSheet: true })

    await fillName(component)
    await selectOption(component, 'summon', { index: 0 })
    await nextTick()
    await selectOption(component, sheet.rows[0]!.id, { index: 1 })
    await submitForm(component)

    const rows = update.mock.calls[0]![0].rows

    expect(rows.at(-1)!.summoner).toEqual({
      name: sheet.rows[0]!.name,
      id: sheet.rows[0]!.id,
    })
  })

  it('Should not attach a summoner when the picked id does not match a row', async () => {
    const component = await mountHomebrew({ withSheet: true })

    await fillName(component)
    await selectOption(component, 'summon', { index: 0 })
    await nextTick()
    await selectOption(component, 'unknown-id', { index: 1 })
    await submitForm(component)

    const rows = update.mock.calls[0]![0].rows

    expect(rows.at(-1)!.summoner).toBeUndefined()
  })

  it('Should switch tabs when the tabs model is updated directly', async () => {
    const component = await mountHomebrew()

    await component
      .findComponent({ name: 'TabsRoot' })
      .vm.$emit('update:modelValue', 'traits')
    await nextTick()

    expect(
      component.findAll('[role="tab"]')[2]!.attributes('aria-selected'),
    ).toBe('true')
  })

  it('Should block saving to a campaign that has the maximum homebrews', async () => {
    homebrewCount.value = 100

    const component = await mountHomebrew({
      withSheet: true,
      isEncounter: true,
      campaignId: mockCampaignFull.id,
    })

    expect(homebrewCountEnabled.value).toBe(true)
    expect(
      component.get('#saveToCampaign').attributes('disabled'),
    ).toBeDefined()
    expect(component.text()).toContain('components.homebrewModal.max')
  })

  it('Should allow saving to the campaign on a sheet with many rows', async () => {
    homebrewCount.value = 99

    const rows = Array.from({ length: 100 }, (_row, index) => ({
      ...sheet.rows[0]!,
      id: `row-${index}`,
      index,
    }))

    const component = await mountHomebrew({
      withSheet: true,
      isEncounter: true,
      campaignId: mockCampaignFull.id,
      rows,
    })

    expect(
      component.get('#saveToCampaign').attributes('disabled'),
    ).toBeUndefined()
    expect(component.text()).not.toContain('components.homebrewModal.max')
  })

  it('Should not count the campaign homebrews outside an encounter', async () => {
    await mountHomebrew({ campaignId: mockCampaignFull.id })

    expect(homebrewCountEnabled.value).toBe(false)
  })

  describe('Picking a type', () => {
    function form(component: Awaited<ReturnType<typeof mountHomebrew>>) {
      return component.get<HTMLFormElement>('form').element
    }

    it('Should start with a card per homebrew type when creating', async () => {
      const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

      for (const type of homebrewType) {
        expect(component.find(`[test-id="choice-${type}"]`).exists()).toBe(true)
      }
      expect(form(component).style.display).toBe('none')
    })

    it('Should describe each type on its card', async () => {
      const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

      expect(component.get('[test-id="choice-lair"]').text()).toContain(
        'components.homebrewModal.types.lair',
      )
    })

    it('Should show the form with the picked type', async () => {
      const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

      await component.get('[test-id="choice-npc"]').trigger('click')
      await nextTick()

      expect(component.find('[test-id="choice-npc"]').exists()).toBe(false)
      expect(form(component).style.display).toBe('')

      await fillName(component)
      await submitForm(component)

      expect(createOptions().data).toMatchObject({ type: 'npc' })
    })

    it('Should go back to the type cards from the first tab', async () => {
      const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

      await component.get('[test-id="choice-npc"]').trigger('click')
      await nextTick()

      expect(
        component.get('[test-id="prev"]').attributes('disabled'),
      ).toBeUndefined()

      await component.get('[test-id="prev"]').trigger('click')
      await nextTick()

      expect(component.find('[test-id="choice-npc"]').exists()).toBe(true)
      expect(form(component).style.display).toBe('none')
    })

    it('Should keep the entered values when changing the type', async () => {
      const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

      await component.get('[test-id="choice-npc"]').trigger('click')
      await nextTick()
      await fillName(component)
      await component.get('[test-id="prev"]').trigger('click')
      await nextTick()
      await component.get('[test-id="choice-lair"]').trigger('click')
      await nextTick()
      await submitForm(component)

      expect(createOptions().data).toMatchObject({
        name: 'Grommash',
        type: 'lair',
      })
    })

    it('Should open on the info tab after picking a type', async () => {
      const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

      await component.get('[test-id="choice-npc"]').trigger('click')
      await nextTick()
      await component.get('[test-id="next"]').trigger('click')
      await nextTick()
      await component.get('[test-id="prev"]').trigger('click')
      await nextTick()
      await component.get('[test-id="prev"]').trigger('click')
      await nextTick()
      await component.get('[test-id="choice-player"]').trigger('click')
      await nextTick()

      expect(
        component.findAll('[role="tab"]')[0]!.attributes('aria-selected'),
      ).toBe('true')
    })

    it('Should skip the type cards when editing a campaign homebrew', async () => {
      const component = await mountHomebrew({ item: mockHomebrewItem })

      expect(component.find('[test-id="choice-player"]').exists()).toBe(false)
      expect(form(component).style.display).toBe('')
    })

    it('Should skip the type cards when remixing a monster', async () => {
      const component = await mountHomebrew({
        withSheet: true,
        template: { name: 'Goblin', type: 'monster' },
      })

      expect(component.find('[test-id="choice-player"]').exists()).toBe(false)
    })

    it('Should skip the type cards when editing a row', async () => {
      const component = await mountHomebrew({
        withSheet: true,
        row: sheet.rows[0]!,
      })

      expect(component.find('[test-id="choice-player"]').exists()).toBe(false)
    })
  })

  describe('Starting a creature', () => {
    type Wrapper = Awaited<ReturnType<typeof mountHomebrew>>

    function isFormShown(component: Wrapper) {
      return component.get<HTMLFormElement>('form').element.style.display === ''
    }

    async function click(component: Wrapper, testId: string) {
      await component.get(`[test-id="${testId}"]`).trigger('click')
      await nextTick()
    }

    async function remixFromBestiary(component: Wrapper) {
      await click(component, 'choice-monster')
      await click(component, 'choice-bestiary')
      await component
        .findComponent(FormBestiaryStub)
        .vm.$emit('remix', dndMonsterFixture)
      await flushPromises()
    }

    it('Should ask where to start after picking a creature', async () => {
      const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

      await click(component, 'choice-monster')

      expect(component.find('[test-id="choice-scratch"]').exists()).toBe(true)
      expect(component.find('[test-id="choice-bestiary"]').exists()).toBe(true)
      expect(isFormShown(component)).toBe(false)
    })

    it('Should go back to the type cards from the start cards', async () => {
      const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

      await click(component, 'choice-monster')
      await click(component, 'step-back')

      expect(component.find('[test-id="choice-npc"]').exists()).toBe(true)
      expect(component.find('[test-id="choice-scratch"]').exists()).toBe(false)
    })

    it('Should show an empty creature form when starting from scratch', async () => {
      const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

      await click(component, 'choice-monster')
      await click(component, 'choice-scratch')

      expect(isFormShown(component)).toBe(true)
      expect(component.find('[test-id="based-on"]').exists()).toBe(false)

      await fillName(component)
      await submitForm(component)

      expect(createOptions().data).toMatchObject({
        name: 'Grommash',
        type: 'monster',
      })
    })

    it('Should show the bestiary without the add button', async () => {
      const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

      await click(component, 'choice-monster')
      await click(component, 'choice-bestiary')

      const bestiary = component.findComponent(FormBestiaryStub)

      expect(bestiary.exists()).toBe(true)
      expect(bestiary.props('addable')).toBe(false)
      expect(isFormShown(component)).toBe(false)
    })

    it('Should go back to the start cards from the bestiary', async () => {
      const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

      await click(component, 'choice-monster')
      await click(component, 'choice-bestiary')
      await click(component, 'step-back')

      expect(component.findComponent(FormBestiaryStub).exists()).toBe(false)
      expect(component.find('[test-id="choice-bestiary"]').exists()).toBe(true)
    })

    it('Should prefill the form with the remixed monster', async () => {
      const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

      await remixFromBestiary(component)

      expect(isFormShown(component)).toBe(true)
      expect(
        component.get<HTMLInputElement>('input[name="name"]').element.value,
      ).toBe(dndMonsterFixture.name)
      expect(component.find('[test-id="based-on"]').exists()).toBe(true)
    })

    it('Should save the remixed monster as a campaign homebrew', async () => {
      const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

      await remixFromBestiary(component)
      await submitForm(component)

      expect(createOptions().data).toMatchObject({
        name: dndMonsterFixture.name,
        type: 'monster',
        hitPoints: dndMonsterFixture.hitPoints,
        armorClass: dndMonsterFixture.armorClass,
        campaign: mockCampaignFull.id,
      })
    })

    it('Should add one remixed monster to the sheet by default', async () => {
      const component = await mountHomebrew({
        withSheet: true,
        isEncounter: true,
      })

      await remixFromBestiary(component)
      await submitForm(component)

      const rows: InitiativeSheetRow[] = update.mock.calls[0]![0].rows

      expect(rows).toHaveLength(sheet.rows.length + 1)
      expect(rows.at(-1)).toMatchObject({
        name: dndMonsterFixture.name,
        type: 'monster',
      })
    })

    it('Should go back to the start cards from the first tab', async () => {
      const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

      await remixFromBestiary(component)
      await click(component, 'prev')

      expect(component.find('[test-id="choice-scratch"]').exists()).toBe(true)
    })

    it('Should drop the remixed monster when switching to scratch', async () => {
      const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

      await remixFromBestiary(component)
      await click(component, 'prev')
      await click(component, 'choice-scratch')

      expect(
        component.get<HTMLInputElement>('input[name="name"]').element.value,
      ).toBe('')
      expect(component.find('[test-id="based-on"]').exists()).toBe(false)
    })

    it('Should keep the typed values when starting from scratch twice', async () => {
      const component = await mountHomebrew({ campaignId: mockCampaignFull.id })

      await click(component, 'choice-monster')
      await click(component, 'choice-scratch')
      await fillName(component)
      await click(component, 'prev')
      await click(component, 'choice-scratch')

      expect(
        component.get<HTMLInputElement>('input[name="name"]').element.value,
      ).toBe('Grommash')
    })
  })

  describe('Remixing a monster', () => {
    const template = {
      name: 'Goblin Boss',
      type: 'monster' as const,
      hitPoints: 21,
      armorClass: 17,
      link: 'https://example.com/goblin-boss',
    }

    function mountRemix() {
      return mountHomebrew({
        withSheet: true,
        isEncounter: true,
        campaignId: mockCampaignFull.id,
        template,
      })
    }

    it('Should prefill the form with the monster and an amount of one', async () => {
      const component = await mountRemix()

      expect(
        component.get<HTMLInputElement>('input[name="name"]').element.value,
      ).toBe(template.name)
      expect(
        component.get<HTMLInputElement>('input[name="hitPoints"]').element
          .value,
      ).toBe(String(template.hitPoints))
      expect(
        component.get<HTMLInputElement>('input[name="amount"]').element.value,
      ).toBe('1')
    })

    it('Should add the remixed monster as new rows', async () => {
      const component = await mountRemix()

      await fillName(component, 'Goblin Warlord')
      await submitForm(component)

      const rows: InitiativeSheetRow[] = update.mock.calls[0]![0].rows

      expect(rows).toHaveLength(sheet.rows.length + 1)
      expect(rows.find(r => r.name === 'Goblin Warlord')).toMatchObject({
        type: 'monster',
        hitPoints: template.hitPoints,
        link: template.link,
      })
      expect(component.emitted('close')).toHaveLength(1)
    })
  })

  describe('Editing a row', () => {
    const damaged: InitiativeSheetRow = {
      ...sheet.rows[1]!,
      type: 'monster',
      hitPoints: 40,
      homebrew: 7,
    }
    const rows = sheet.rows.map(r => (r.id === damaged.id ? damaged : r))

    function mountEdit() {
      return mountHomebrew({
        withSheet: true,
        isEncounter: true,
        campaignId: mockCampaignFull.id,
        row: damaged,
        rows,
      })
    }

    function editedRow(): InitiativeSheetRow | undefined {
      const updated: InitiativeSheetRow[] = update.mock.calls[0]![0].rows

      return updated.find(r => r.id === damaged.id)
    }

    it('Should prefill the form with the base stats of the row', async () => {
      const component = await mountEdit()

      expect(
        component.get<HTMLInputElement>('input[name="name"]').element.value,
      ).toBe(damaged.name)
      expect(
        component.get<HTMLInputElement>('input[name="hitPoints"]').element
          .value,
      ).toBe(String(damaged.maxHitPoints))
      expect(
        component.get<HTMLInputElement>('input[name="armorClass"]').element
          .value,
      ).toBe(String(damaged.maxArmorClass))
    })

    it('Should hide the amount and initiative fields', async () => {
      const component = await mountEdit()

      expect(component.find('input[name="amount"]').exists()).toBe(false)
      expect(component.find('input[name="initiative"]').exists()).toBe(false)
    })

    it('Should offer to update the linked campaign homebrew, even when the campaign is full', async () => {
      homebrewCount.value = 100

      const component = await mountEdit()

      expect(homebrewCountEnabled.value).toBe(false)
      expect(
        component.get('#saveToCampaign').attributes('disabled'),
      ).toBeUndefined()
      expect(component.text()).toContain(
        'components.homebrewModal.updateCampaign',
      )
      expect(component.text()).not.toContain('components.homebrewModal.max')
    })

    it('Should update the linked campaign homebrew when the switch is on', async () => {
      const component = await mountEdit()

      await component.get('#saveToCampaign').trigger('click')
      await component
        .get('input[name="link"]')
        .setValue('https://example.com/goblin')
      await flushPromises()
      await submitForm(component)

      expect(updateOptions()).toMatchObject({
        id: damaged.homebrew,
        data: expect.objectContaining({
          name: damaged.name,
          link: 'https://example.com/goblin',
          hitPoints: damaged.maxHitPoints,
        }),
      })
      expect(createHomebrew).not.toHaveBeenCalled()
      expect(editedRow()).toMatchObject({
        homebrew: damaged.homebrew,
        link: 'https://example.com/goblin',
      })
      expect(component.emitted('close')).toHaveLength(1)
    })

    it('Should leave the campaign homebrew alone when the switch is off', async () => {
      const component = await mountEdit()

      await submitForm(component)

      expect(updateHomebrew).not.toHaveBeenCalled()
      expect(editedRow()?.homebrew).toBe(damaged.homebrew)
    })

    it('Should keep the row unchanged when updating the campaign homebrew fails', async () => {
      updateHomebrew.mockRejectedValue(new Error('not found'))

      const component = await mountEdit()

      await component.get('#saveToCampaign').trigger('click')
      await submitForm(component)

      expect(update).not.toHaveBeenCalled()
      expect(component.emitted('close')).toBeUndefined()
    })

    it('Should add an unlinked row to the campaign and link it', async () => {
      createHomebrew.mockResolvedValue(42)

      const unlinked = { ...damaged, homebrew: undefined }
      const component = await mountHomebrew({
        withSheet: true,
        isEncounter: true,
        campaignId: mockCampaignFull.id,
        row: unlinked,
        rows: sheet.rows.map(r => (r.id === unlinked.id ? unlinked : r)),
      })

      expect(component.text()).toContain('components.homebrewModal.save')

      await component.get('#saveToCampaign').trigger('click')
      await submitForm(component)

      expect(createOptions()).toMatchObject({
        data: expect.objectContaining({
          name: unlinked.name,
          campaign: mockCampaignFull.id,
        }),
      })
      expect(updateHomebrew).not.toHaveBeenCalled()
      expect(editedRow()?.homebrew).toBe(42)
    })

    it('Should update the row in place and keep its combat state', async () => {
      const component = await mountEdit()

      await component
        .get('input[name="link"]')
        .setValue('https://example.com/goblin')
      await flushPromises()
      await submitForm(component)

      const updated: InitiativeSheetRow[] = update.mock.calls[0]![0].rows

      expect(updated).toHaveLength(rows.length)
      expect(editedRow()).toMatchObject({
        id: damaged.id,
        index: damaged.index,
        initiative: damaged.initiative,
        homebrew: damaged.homebrew,
        conditions: damaged.conditions,
        hitPoints: 40,
        maxHitPoints: damaged.maxHitPoints,
        link: 'https://example.com/goblin',
      })
      expect(createHomebrew).not.toHaveBeenCalled()
      expect(component.emitted('close')).toHaveLength(1)
    })

    it('Should reset the current hit points when the base changes', async () => {
      const component = await mountEdit()

      await component.get('input[name="hitPoints"]').setValue(120)
      await flushPromises()
      await submitForm(component)

      expect(editedRow()).toMatchObject({ hitPoints: 120, maxHitPoints: 120 })
    })
  })
})
