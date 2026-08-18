import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Homebrew from '~/components/form/Homebrew.vue'
import { mockCampaignFull } from '~~/test/fixtures/campaign'
import { mockHomebrewItem } from '~~/test/fixtures/homebrew'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { submitForm } from '~~/test/nuxt/stubs/form'
import { selectOption } from '~~/test/nuxt/stubs/popover'

const { createHomebrew, updateHomebrew } = vi.hoisted(() => ({
  createHomebrew: vi.fn(),
  updateHomebrew: vi.fn(),
}))

vi.mock('~/queries/homebrews', () => ({
  useHomebrewCreate: () => ({ mutateAsync: createHomebrew }),
  useHomebrewUpdate: () => ({ mutateAsync: updateHomebrew }),
}))

const update = vi.fn()

interface MountOptions {
  campaignId?: number
  item?: HomebrewItemRow
  isEncounter?: boolean
  withSheet?: boolean
  rows?: InitiativeSheetRow[]
}

function mountHomebrew({
  campaignId,
  item,
  isEncounter = false,
  withSheet = false,
  rows = sheet.rows,
}: MountOptions = {}) {
  return mountSuspended(Homebrew, {
    props: {
      count: 0,
      campaignId,
      item,
      isEncounter,
      sheet: withSheet ? { ...sheet, rows } : undefined,
      update: withSheet ? update : undefined,
    },
  })
}

async function fillName(
  component: Awaited<ReturnType<typeof mountHomebrew>>,
  name = 'Grommash',
) {
  await component.get('input[name="name"]').setValue(name)
  await flushPromises()
}

function createOptions() {
  return createHomebrew.mock.calls[0]![0]
}

function updateOptions() {
  return updateHomebrew.mock.calls[0]![0]
}

describe('Homebrew', () => {
  beforeEach(() => {
    vi.clearAllMocks()

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

  it('Should not go back from the first tab', async () => {
    const component = await mountHomebrew()

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

    createOptions().onSuccess()

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

  it('Should not add to the sheet when the update handler is missing', async () => {
    const component = await mountSuspended(Homebrew, {
      props: {
        count: 0,
        sheet: { ...sheet },
        update: undefined,
      },
    })

    await fillName(component)
    await submitForm(component)

    expect(component.emitted('close')).toHaveLength(1)
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

  it('Should block saving to the campaign on a full sheet', async () => {
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
    ).toBeDefined()
    expect(component.text()).toContain('components.homebrewModal.max')
  })
})
