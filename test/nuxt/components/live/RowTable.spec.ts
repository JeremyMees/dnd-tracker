import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it } from 'vitest'
import LiveRowTable from '~/components/live/RowTable.vue'
import { playerSheet, playerRow } from '~~/test/fixtures/player-portal'
import { setSeat, stubRowElement } from '~~/test/nuxt/stubs/live'

const ownRow: PlayerRow = {
  ...playerRow,
  hitPoints: 12,
  maxHitPoints: 20,
  tempHitPoints: 2,
  armorClass: 16,
  concentration: true,
  deathSaves: { save: [true, false, false], fail: [false, false, false] },
  conditions: [{ id: 'poisoned', name: 'Poisoned', desc: '' }],
}

const monsterRow: PlayerRow = {
  id: 'row-2',
  index: 1,
  initiative: 18,
  name: 'Goblin 1',
  type: 'monster',
  conditions: [],
  healthBand: 'bloodied',
  deathSaves: { save: [false, false, false], fail: [true, true, true] },
}

function sheetWith(rows: PlayerRow[], activeIndex = 0): PlayerSheet {
  return { ...playerSheet, rows, activeIndex }
}

describe('LiveRowTable', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders a row per combatant with its name and initiative', async () => {
    const component = await mountSuspended(LiveRowTable, {
      props: { sheet: sheetWith([ownRow, monsterRow]), loading: false },
    })

    const rows = component.findAll('[test-id="row"]')

    expect(rows).toHaveLength(2)
    expect(rows[0]!.get('[test-id="name"]').text()).toBe('Elara')
    expect(rows[0]!.get('[test-id="initiative"]').text()).toBe('15')
    expect(rows[1]!.get('[test-id="name"]').text()).toBe('Goblin 1')
  })

  it('shows a placeholder dash when initiative has not been rolled', async () => {
    const component = await mountSuspended(LiveRowTable, {
      props: {
        sheet: sheetWith([{ ...ownRow, initiative: -1 }, monsterRow]),
        loading: false,
      },
    })

    const row = component.findAll('[test-id="row"]')[0]!

    expect(row.get('[test-id="initiative-empty"]').text()).toBe('—')
    expect(row.find('[test-id="initiative"]').exists()).toBe(false)
  })

  it('marks the row taking its turn as active', async () => {
    const component = await mountSuspended(LiveRowTable, {
      props: { sheet: sheetWith([ownRow, monsterRow], 1), loading: false },
    })

    const rows = component.findAll('[test-id="row"]')

    expect(rows[0]!.attributes('data-active')).toBe('false')
    expect(rows[1]!.attributes('data-active')).toBe('true')
  })

  it('shows hit points, armor class and concentration for a visible row', async () => {
    const component = await mountSuspended(LiveRowTable, {
      props: { sheet: sheetWith([ownRow, monsterRow]), loading: false },
    })

    const row = component.findAll('[test-id="row"]')[0]!

    expect(row.get('[test-id="hp"]').text()).toContain('12')
    expect(row.get('[test-id="hp"]').text()).toContain('20')
    expect(row.get('[test-id="hp"]').text()).toContain('+2')
    expect(row.get('[test-id="ac"]').text()).toBe('16')
    expect(row.get('[test-id="concentration"]').attributes('data-active')).toBe(
      'true',
    )
    expect(row.get('[test-id="conditions"]').text()).toContain('Poisoned')
  })

  it('replaces hidden hit points and armor class with a dash', async () => {
    const component = await mountSuspended(LiveRowTable, {
      props: { sheet: sheetWith([ownRow, monsterRow]), loading: false },
    })

    const row = component.findAll('[test-id="row"]')[1]!

    expect(row.find('[test-id="hp"]').exists()).toBe(false)
    expect(row.get('[test-id="hp-hidden"]').text()).toBe('—')
    expect(row.get('[test-id="ac-hidden"]').text()).toBe('—')
    expect(row.get('[test-id="health-band"]').text()).toBe('general.bloodied')
  })

  it('shows the own badge only for the claimed row', async () => {
    setSeat({ row: ownRow.id })

    const component = await mountSuspended(LiveRowTable, {
      props: { sheet: sheetWith([ownRow, monsterRow]), loading: false },
    })

    const rows = component.findAll('[test-id="row"]')

    expect(rows[0]!.find('[test-id="own"]').exists()).toBe(true)
    expect(rows[1]!.find('[test-id="own"]').exists()).toBe(false)
  })

  it('shows death saves only for the claimed row', async () => {
    setSeat({ row: ownRow.id })

    const component = await mountSuspended(LiveRowTable, {
      props: { sheet: sheetWith([ownRow, monsterRow]), loading: false },
    })

    const rows = component.findAll('[test-id="row"]')

    expect(rows[0]!.find('[test-id="death-saves"]').exists()).toBe(true)
    expect(rows[1]!.find('[test-id="death-saves"]').exists()).toBe(false)
  })

  it('drops the columns that no row exposes', async () => {
    const component = await mountSuspended(LiveRowTable, {
      props: {
        sheet: sheetWith([{ ...monsterRow, healthBand: undefined }]),
        loading: false,
      },
    })

    const headers = component
      .findAll('[test-id="header"]')
      .map(header => header.text())

    expect(headers).toEqual([
      'components.encounterTable.headers.name',
      'components.encounterTable.headers.init',
      'components.encounterTable.headers.concentration',
    ])
  })

  it('keeps every column while loading', async () => {
    const component = await mountSuspended(LiveRowTable, {
      props: { loading: true },
    })

    expect(component.findAll('[test-id="header"]')).toHaveLength(8)
    expect(component.findAll('[test-id="loading"]')).toHaveLength(6)
  })

  it('shows nothing when there is no sheet and nothing is pending', async () => {
    const component = await mountSuspended(LiveRowTable, {
      props: { loading: false },
    })

    expect(component.find('[test-id="row"]').exists()).toBe(false)
    expect(component.find('[test-id="loading"]').exists()).toBe(false)
  })

  it('scrolls the active row into view when it is out of view', async () => {
    const sheet = sheetWith([ownRow, monsterRow], 1)

    const component = await mountSuspended(LiveRowTable, {
      props: { sheet, loading: false },
    })

    const container = component.get('[test-id="list"]').element as HTMLElement
    const scrollIntoView = stubRowElement(
      component.findAll('[test-id="row"]')[0]!,
      { top: -50, bottom: -10 },
    )

    container.getBoundingClientRect = () => ({ top: 0, bottom: 200 }) as DOMRect

    await component.setProps({ sheet: { ...sheet, activeIndex: 0 } })
    await nextTick()

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'nearest',
    })
  })
})
