import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import LivePlayerView from '~/components/live/PlayerView.vue'
import { playerSheet as sheet } from '~~/test/fixtures/player-portal'

const RowProbe = defineComponent({
  props: ['row', 'active'],
  template:
    '<div test-id="row-probe" :data-active="active">{{ row.name }}</div>',
})

const stubs = { LiveRowCard: RowProbe }

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
})
