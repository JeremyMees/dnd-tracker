import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it } from 'vitest'
import LiveRowList from '~/components/live/RowList.vue'
import { playerSheet as sheet } from '~~/test/fixtures/player-portal'
import { stubRowElement } from '~~/test/nuxt/stubs/live'

const RowProbe = defineComponent({
  props: ['row', 'active'],
  template:
    '<div test-id="row-probe" :data-active="active">{{ row.name }}</div>',
})

const stubs = { LiveRowCard: RowProbe }

describe('LiveRowList', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders a card per row and marks the active one', async () => {
    const component = await mountSuspended(LiveRowList, {
      props: { sheet, loading: false },
      global: { stubs },
    })

    const rows = component.findAll('[test-id="row-probe"]')

    expect(rows).toHaveLength(2)
    expect(rows[0]!.attributes('data-active')).toBe('false')
    expect(rows[1]!.attributes('data-active')).toBe('true')
  })

  it('shows loading skeletons while pending with no sheet yet', async () => {
    const component = await mountSuspended(LiveRowList, {
      props: { loading: true },
      global: { stubs },
    })

    expect(component.findAll('[test-id="loading"]')).toHaveLength(4)
  })

  it('shows nothing when there is no sheet and nothing is pending', async () => {
    const component = await mountSuspended(LiveRowList, {
      props: { loading: false },
      global: { stubs },
    })

    expect(component.find('[test-id="row-probe"]').exists()).toBe(false)
    expect(component.find('[test-id="loading"]').exists()).toBe(false)
  })

  it('scrolls the active row into view when it is out of view', async () => {
    const component = await mountSuspended(LiveRowList, {
      props: { sheet, loading: false },
      global: { stubs },
    })

    const container = component.get('[test-id="list"]').element as HTMLElement
    const scrollIntoView = stubRowElement(
      component.findAll('[test-id="row-probe"]')[0]!,
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

  it('does not scroll when the active row is already in view', async () => {
    const component = await mountSuspended(LiveRowList, {
      props: { sheet, loading: false },
      global: { stubs },
    })

    const container = component.get('[test-id="list"]').element as HTMLElement
    const scrollIntoView = stubRowElement(
      component.findAll('[test-id="row-probe"]')[0]!,
      { top: 10, bottom: 60 },
    )

    container.getBoundingClientRect = () => ({ top: 0, bottom: 200 }) as DOMRect

    await component.setProps({ sheet: { ...sheet, activeIndex: 0 } })
    await nextTick()

    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('does not scroll when there is no longer an active row to find', async () => {
    const component = await mountSuspended(LiveRowList, {
      props: { sheet, loading: false },
      global: { stubs },
    })

    const scrollIntoView = stubRowElement(
      component.findAll('[test-id="row-probe"]')[0]!,
      { top: -50, bottom: -10 },
    )

    await component.setProps({ sheet: undefined })
    await nextTick()

    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})
