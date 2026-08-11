import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import LivePlayerView from '~/components/live/PlayerView.vue'
import { playerSheet as sheet } from '~~/test/fixtures/player-portal'

const RowProbe = defineComponent({
  props: ['row', 'active'],
  template:
    '<div test-id="row-probe" :data-active="active">{{ row.name }}</div>',
})

const PanelProbe = defineComponent({
  props: ['row', 'active'],
  template:
    '<div test-id="panel-probe" :data-active="active">{{ row.name }}</div>',
})

const stubs = { LiveRowCard: RowProbe, LiveMyCharacterPanel: PanelProbe }

function setSeat(overrides: Partial<LiveJoinResponse> = {}): void {
  localStorage.setItem(
    'live-seat',
    JSON.stringify({
      sessionToken: 'session-token',
      seatToken: 'seat-token',
      seat: 'seat-1',
      row: 'row-1',
      spectator: false,
      code: 'ABC234',
      expiresAt: 'later',
      uuid: 'session-uuid',
      ...overrides,
    }),
  )
}

describe('LivePlayerView', () => {
  it('shows an error state when the query failed', async () => {
    const component = await mountSuspended(LivePlayerView, {
      props: { loading: false, error: true },
      global: { stubs },
    })

    expect(component.get('[test-id="error"]').text()).toContain(
      'general.error.text',
    )
    expect(component.find('[test-id="row-probe"]').exists()).toBe(false)
  })

  it('shows loading skeletons while pending with no sheet yet', async () => {
    const component = await mountSuspended(LivePlayerView, {
      props: { loading: true, error: false },
      global: { stubs },
    })

    expect(component.findAll('[test-id="loading"]')).toHaveLength(4)
  })

  it('renders the sheet title, round and rows', async () => {
    const component = await mountSuspended(LivePlayerView, {
      props: { sheet, loading: false, error: false },
      global: { stubs },
    })

    expect(component.get('[test-id="title"]').text()).toBe('Goblin Ambush')
    expect(component.get('[test-id="round"]').text()).toBe('2')

    const rows = component.findAll('[test-id="row-probe"]')

    expect(rows).toHaveLength(2)
    expect(rows[1]!.attributes('data-active')).toBe('true')
    expect(rows[0]!.attributes('data-active')).toBe('false')
  })

  it('does not show the my-character panel without a claimed seat', async () => {
    localStorage.clear()

    const component = await mountSuspended(LivePlayerView, {
      props: { sheet, loading: false, error: false },
      global: { stubs },
    })

    expect(component.find('[test-id="panel-probe"]').exists()).toBe(false)
  })

  it('does not show the my-character panel for a spectator seat', async () => {
    setSeat({ row: sheet.rows[0]!.id, spectator: true })

    const component = await mountSuspended(LivePlayerView, {
      props: { sheet, loading: false, error: false },
      global: { stubs },
    })

    expect(component.find('[test-id="panel-probe"]').exists()).toBe(false)
  })

  it('shows the my-character panel for the claimed row', async () => {
    setSeat({ row: sheet.rows[0]!.id })

    const component = await mountSuspended(LivePlayerView, {
      props: { sheet, loading: false, error: false },
      global: { stubs },
    })

    const panel = component.get('[test-id="panel-probe"]')

    expect(panel.text()).toBe(sheet.rows[0]!.name)
    expect(panel.attributes('data-active')).toBe('false')
  })

  it('marks the panel as active when the claimed row is taking its turn', async () => {
    setSeat({ row: sheet.rows[1]!.id })

    const component = await mountSuspended(LivePlayerView, {
      props: { sheet, loading: false, error: false },
      global: { stubs },
    })

    expect(
      component.get('[test-id="panel-probe"]').attributes('data-active'),
    ).toBe('true')
  })

  it('scrolls the active row into view within the list when it is out of view', async () => {
    localStorage.clear()

    const component = await mountSuspended(LivePlayerView, {
      props: { sheet, loading: false, error: false },
      global: { stubs },
    })

    const container = component.get('[test-id="list"]').element as HTMLElement
    const rows = component.findAll('[test-id="row-probe"]')
    const target = rows[0]!.element as HTMLElement
    const scrollIntoView = vi.fn()

    container.getBoundingClientRect = () => ({ top: 0, bottom: 200 }) as DOMRect
    target.getBoundingClientRect = () => ({ top: -50, bottom: -10 }) as DOMRect
    target.scrollIntoView = scrollIntoView

    await component.setProps({
      sheet: { ...sheet, activeIndex: 0 },
    })
    await nextTick()

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'nearest',
    })
  })

  it('does not scroll when the active row is already in view', async () => {
    localStorage.clear()

    const component = await mountSuspended(LivePlayerView, {
      props: { sheet, loading: false, error: false },
      global: { stubs },
    })

    const container = component.get('[test-id="list"]').element as HTMLElement
    const rows = component.findAll('[test-id="row-probe"]')
    const target = rows[0]!.element as HTMLElement
    const scrollIntoView = vi.fn()

    container.getBoundingClientRect = () => ({ top: 0, bottom: 200 }) as DOMRect
    target.getBoundingClientRect = () => ({ top: 10, bottom: 60 }) as DOMRect
    target.scrollIntoView = scrollIntoView

    await component.setProps({
      sheet: { ...sheet, activeIndex: 0 },
    })

    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})
