import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LivePlayerView from '~/components/live/PlayerView.vue'
import { playerSheet as sheet } from '~~/test/fixtures/player-portal'
import { setSeat, setViewport } from '~~/test/nuxt/stubs/live'

const TableProbe = defineComponent({
  props: ['sheet', 'loading'],
  template: '<div test-id="table-probe" :data-loading="loading" />',
})

const ListProbe = defineComponent({
  props: ['sheet', 'loading'],
  template: '<div test-id="list-probe" :data-loading="loading" />',
})

const SidePanelProbe = defineComponent({
  props: ['row', 'activeRow', 'allow'],
  template:
    '<div test-id="side-panel-probe" :data-active-row="activeRow?.id" :data-allow="JSON.stringify(allow)">{{ row.name }}</div>',
})

const PanelProbe = defineComponent({
  props: ['row', 'activeRow', 'allow'],
  template:
    '<div test-id="panel-probe" :data-active-row="activeRow?.id">{{ row.name }}</div>',
})

const stubs = {
  LiveRowTable: TableProbe,
  LiveRowList: ListProbe,
  LiveMyCharacterSidePanel: SidePanelProbe,
  LiveMyCharacterPanel: PanelProbe,
}

describe('LivePlayerView', () => {
  beforeEach(() => {
    localStorage.clear()
    setViewport('desktop')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows an error state when the query failed', async () => {
    const component = await mountSuspended(LivePlayerView, {
      props: { loading: false, error: true },
      global: { stubs },
    })

    expect(component.get('[test-id="error"]').text()).toContain(
      'general.error.text',
    )
    expect(component.find('[test-id="table-probe"]').exists()).toBe(false)
  })

  it('renders the sheet title and round', async () => {
    const component = await mountSuspended(LivePlayerView, {
      props: { sheet, loading: false, error: false },
      global: { stubs },
    })

    expect(component.get('[test-id="title"]').text()).toBe('Goblin Ambush')
    expect(component.get('[test-id="round"]').text()).toBe('2')
  })

  it('hides the header while there is no sheet yet', async () => {
    const component = await mountSuspended(LivePlayerView, {
      props: { loading: true, error: false },
      global: { stubs },
    })

    expect(component.find('[test-id="title"]').exists()).toBe(false)
    expect(
      component.get('[test-id="table-probe"]').attributes('data-loading'),
    ).toBe('true')
  })

  it('renders the table and side panel on desktop', async () => {
    setSeat({ row: sheet.rows[0]!.id })

    const component = await mountSuspended(LivePlayerView, {
      props: { sheet, loading: false, error: false },
      global: { stubs },
    })

    expect(component.find('[test-id="table-probe"]').exists()).toBe(true)
    expect(component.find('[test-id="list-probe"]').exists()).toBe(false)
    expect(component.find('[test-id="side-panel-probe"]').exists()).toBe(true)
    expect(component.find('[test-id="panel-probe"]').exists()).toBe(false)
  })

  it('renders the card list and bottom panel on mobile', async () => {
    setViewport('mobile')
    setSeat({ row: sheet.rows[0]!.id })

    const component = await mountSuspended(LivePlayerView, {
      props: { sheet, loading: false, error: false },
      global: { stubs },
    })

    expect(component.find('[test-id="list-probe"]').exists()).toBe(true)
    expect(component.find('[test-id="table-probe"]').exists()).toBe(false)
    expect(component.find('[test-id="panel-probe"]').exists()).toBe(true)
    expect(component.find('[test-id="side-panel-probe"]').exists()).toBe(false)
  })

  it('does not show the my-character panel without a claimed seat', async () => {
    const component = await mountSuspended(LivePlayerView, {
      props: { sheet, loading: false, error: false },
      global: { stubs },
    })

    expect(component.find('[test-id="side-panel-probe"]').exists()).toBe(false)
  })

  it('does not show the my-character panel for a spectator seat', async () => {
    setSeat({ row: sheet.rows[0]!.id, spectator: true })

    const component = await mountSuspended(LivePlayerView, {
      props: { sheet, loading: false, error: false },
      global: { stubs },
    })

    expect(component.find('[test-id="side-panel-probe"]').exists()).toBe(false)
  })

  it('passes the claimed row and the row taking its turn to the panel', async () => {
    setSeat({ row: sheet.rows[0]!.id })

    const component = await mountSuspended(LivePlayerView, {
      props: { sheet, loading: false, error: false },
      global: { stubs },
    })

    const panel = component.get('[test-id="side-panel-probe"]')

    expect(panel.text()).toBe(sheet.rows[0]!.name)
    expect(panel.attributes('data-active-row')).toBe(sheet.rows[1]!.id)
  })

  it('falls back to allowing every action when the sheet does not specify allow', async () => {
    setSeat({ row: sheet.rows[0]!.id })

    const sheetWithoutAllow = {
      ...sheet,
      allow: undefined,
    } as unknown as typeof sheet

    const component = await mountSuspended(LivePlayerView, {
      props: { sheet: sheetWithoutAllow, loading: false, error: false },
      global: { stubs },
    })

    const allow = component
      .get('[test-id="side-panel-probe"]')
      .attributes('data-allow')

    expect(JSON.parse(allow!)).toEqual({
      hp: true,
      ac: true,
      deathSaves: true,
      concentration: true,
      conditions: true,
      endTurn: true,
    })
  })
})
