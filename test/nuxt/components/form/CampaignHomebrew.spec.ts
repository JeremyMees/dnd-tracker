import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CampaignHomebrew from '~/components/form/CampaignHomebrew.vue'
import SkeletonHomebrewSelectTableRow from '~/components/skeleton/HomebrewSelectTableRow.vue'
import { mockSheetCampaign } from '~~/test/fixtures/campaign'
import {
  mockHomebrewItem,
  mockHomebrewListing,
  mockHomebrewPlayer,
  mockHomebrewSummon,
} from '~~/test/fixtures/homebrew'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { createInitiativeSheetProvide } from '~~/test/nuxt/stubs/initiative'
import { selectOption } from '~~/test/nuxt/stubs/popover'
import { touchArgs } from '~~/test/nuxt/stubs/queries'

const homebrews = ref<HomebrewItemRow[]>(mockHomebrewListing)
const isPending = ref(false)

vi.mock('~/queries/homebrews', () => ({
  useHomebrewListing: (...args: unknown[]) => {
    touchArgs(...args)

    return {
      data: computed(() => ({ homebrews: homebrews.value })),
      isPending,
    }
  },
}))

const campaignSheet: InitiativeSheet = { ...sheet, campaign: mockSheetCampaign }

function mountCampaignHomebrew(
  initial: InitiativeSheet | null = campaignSheet,
) {
  const injected = createInitiativeSheetProvide(initial)

  return {
    injected,
    mount: () =>
      mountSuspended(CampaignHomebrew, { provide: injected.provide }),
  }
}

function rowsOf(update: ReturnType<typeof vi.fn>): InitiativeSheetRow[] {
  return update.mock.calls[0]![0].rows
}

describe('CampaignHomebrew', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    homebrews.value = mockHomebrewListing
    isPending.value = false
  })

  it('Should match snapshot', async () => {
    const component = await mountCampaignHomebrew().mount()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render a row per homebrew with a search field', async () => {
    const component = await mountCampaignHomebrew().mount()

    expect(component.find('input[name="search"]').exists()).toBeTruthy()
    mockHomebrewListing.forEach(homebrew => {
      expect(component.text()).toContain(homebrew.name)
    })
  })

  it('Should filter the rows on name', async () => {
    const component = await mountCampaignHomebrew().mount()

    await component.get('input[name="search"]').setValue('Goblin')
    await flushPromises()

    expect(component.text()).toContain(mockHomebrewItem.name)
    expect(component.text()).not.toContain(mockHomebrewPlayer.name)
  })

  it('Should filter the rows on player', async () => {
    const component = await mountCampaignHomebrew().mount()

    await component.get('input[name="search"]').setValue('Jeremy')
    await flushPromises()

    expect(component.text()).toContain(mockHomebrewPlayer.name)
    expect(component.text()).not.toContain(mockHomebrewItem.name)
  })

  it('Should show skeleton rows while loading', async () => {
    homebrews.value = []
    isPending.value = true

    const component = await mountCampaignHomebrew().mount()

    expect(
      component.findAllComponents(SkeletonHomebrewSelectTableRow).length,
    ).toBeGreaterThan(0)
    expect(component.text()).not.toContain('components.table.nothing')
  })

  it('Should show the empty message when there are no homebrews', async () => {
    homebrews.value = []

    const component = await mountCampaignHomebrew().mount()

    expect(component.text()).toContain('components.table.nothing')
  })

  it('Should disable adding a selection while nothing is selected', async () => {
    const component = await mountCampaignHomebrew().mount()

    const addSelected = component.get('[aria-label="actions.addSelected"]')

    expect(addSelected.attributes('disabled')).toBeDefined()
    expect(addSelected.text()).toContain('(0)')
  })

  it('Should add every non summon homebrew when adding all', async () => {
    const { injected, mount } = mountCampaignHomebrew()
    const component = await mount()

    await component.get('[aria-label="actions.addAll"]').trigger('click')
    await flushPromises()

    const rows = rowsOf(injected.update)
    const added = rows.slice(sheet.rows.length)

    expect(added).toHaveLength(2)
    expect(added.map(row => row.name)).toEqual([
      mockHomebrewItem.name,
      mockHomebrewPlayer.name,
    ])
  })

  it('Should reindex the rows after adding', async () => {
    const { injected, mount } = mountCampaignHomebrew()
    const component = await mount()

    await component.get('[aria-label="actions.addAll"]').trigger('click')
    await flushPromises()

    const rows = rowsOf(injected.update)

    expect(rows.map(row => row.index)).toEqual(rows.map((_row, i) => i))
  })

  it('Should close after adding', async () => {
    const component = await mountCampaignHomebrew().mount()

    await component.get('[aria-label="actions.addAll"]').trigger('click')
    await flushPromises()

    expect(component.emitted('close')).toHaveLength(1)
  })

  it('Should turn the initiative modifier into a number', async () => {
    const { injected, mount } = mountCampaignHomebrew()
    const component = await mount()

    await component.get('[aria-label="actions.addAll"]').trigger('click')
    await flushPromises()

    const added = rowsOf(injected.update).slice(sheet.rows.length)

    expect(added[0]!.initiativeModifier).toBe(
      Number(mockHomebrewItem.initiativeModifier),
    )
  })

  it('Should ask for a summoner once a summon is selected', async () => {
    const component = await mountCampaignHomebrew().mount()

    await component.findAll('[role="checkbox"]')[3]!.trigger('click')
    await flushPromises()

    expect(component.text()).toContain('components.inputs.summonerLabel')
    expect(component.find('[aria-label="actions.addAll"]').exists()).toBeFalsy()
  })

  it('Should not add a summon before a summoner is picked', async () => {
    const component = await mountCampaignHomebrew().mount()

    await component.findAll('[role="checkbox"]')[3]!.trigger('click')
    await flushPromises()

    expect(
      component
        .get('[aria-label="components.campaignHomebrew.initiative.add"]')
        .attributes('disabled'),
    ).toBeDefined()
  })

  it('Should not add anything without a sheet', async () => {
    const { injected, mount } = mountCampaignHomebrew(null)
    const component = await mount()

    await component.get('[aria-label="actions.addAll"]').trigger('click')
    await flushPromises()

    expect(injected.update).not.toHaveBeenCalled()
    expect(component.emitted('close')).toBeUndefined()
  })

  it('Should only offer non summon rows as summoner', async () => {
    const component = await mountCampaignHomebrew().mount()

    await component.findAll('[role="checkbox"]')[3]!.trigger('click')
    await flushPromises()

    expect(component.text()).toContain(
      'components.campaignHomebrew.initiative.info',
    )
    expect(mockHomebrewSummon.type).toBe('summon')
  })

  it('Should work without a campaign on the sheet', async () => {
    const component = await mountCampaignHomebrew(sheet).mount()

    mockHomebrewListing.forEach(homebrew => {
      expect(component.text()).toContain(homebrew.name)
    })
  })

  it('Should render no summoner options when the sheet has no rows', async () => {
    const { injected, mount } = mountCampaignHomebrew()
    const component = await mount()

    injected.sheet.value = {
      ...injected.sheet.value!,
      rows: undefined,
    } as unknown as InitiativeSheet
    await flushPromises()

    await component.findAll('[role="checkbox"]')[3]!.trigger('click')
    await flushPromises()

    expect(component.text()).toContain('components.inputs.summonerLabel')
    expect(component.text()).not.toContain(sheet.rows[0]!.name)
  })

  it('Should sort the rows when a sortable header is clicked', async () => {
    const component = await mountCampaignHomebrew().mount()

    const playerHeader = component.get('[test-id="header-player"]')

    await playerHeader.trigger('click')
    await flushPromises()

    expect(playerHeader.find('.iconify').exists()).toBeTruthy()
  })

  it('Should add the selected homebrews when adding a selection', async () => {
    const { injected, mount } = mountCampaignHomebrew()
    const component = await mount()

    await component.findAll('[role="checkbox"]')[1]!.trigger('click')
    await flushPromises()

    await component.get('[aria-label="actions.addSelected"]').trigger('click')
    await flushPromises()

    const added = rowsOf(injected.update).slice(sheet.rows.length)

    expect(added).toHaveLength(1)
    expect(added[0]!.name).toBe(mockHomebrewItem.name)
  })

  it('Should set the picked summoner on the added summon', async () => {
    const { injected, mount } = mountCampaignHomebrew()
    const component = await mount()

    await component.findAll('[role="checkbox"]')[3]!.trigger('click')
    await flushPromises()

    await selectOption(component, sheet.rows[0]!.id)

    await component
      .get('[aria-label="components.campaignHomebrew.initiative.add"]')
      .trigger('click')
    await flushPromises()

    const added = rowsOf(injected.update).slice(sheet.rows.length)

    expect(added[0]!.summoner).toEqual({
      name: sheet.rows[0]!.name,
      id: sheet.rows[0]!.id,
    })
  })

  it('Should not set a summoner for an unknown id', async () => {
    const { mount } = mountCampaignHomebrew()
    const component = await mount()

    await component.findAll('[role="checkbox"]')[3]!.trigger('click')
    await flushPromises()

    await selectOption(component, 'unknown-id')

    expect(
      component
        .get('[aria-label="components.campaignHomebrew.initiative.add"]')
        .attributes('disabled'),
    ).toBeDefined()
  })
})
