import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import TableEmptyState from '~/components/initiative/TableEmptyState.vue'

describe('Initiative table empty state', () => {
  it('Should match snapshot with campaign prop', async () => {
    const component = await mountSuspended(TableEmptyState, { props: { campaign: true } })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should match snapshot without campaign prop', async () => {
    const component = await mountSuspended(TableEmptyState, { props: { campaign: false } })

    expect(component.html()).toMatchSnapshot()
  })
})
