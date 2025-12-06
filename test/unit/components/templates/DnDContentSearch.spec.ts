import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import DnDContentSearch from '~/components/templates/DnDContentSearch'
import { sheet } from '~~/test/unit/fixtures/initiative-sheet'
import open5eItem from '~~/test/unit/fixtures/open5e-item.json'
import armorListing from '~~/test/unit/fixtures/armor-listing.json'

interface Props {
  variant?: 'secondary' | 'background'
  sheet?: InitiativeSheet
  update?: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
  allowPin?: boolean
}

const mockUpdate = vi.fn()
const mockToast = vi.fn()

const mockItem = open5eItem as unknown as Open5eItem
const status = ref('success')
const data = ref({ items: armorListing, pages: 1 })

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

vi.mock('~~/queries/open5e', () => ({
  useOpen5eListing: () => ({ data, status }),
}))

const props: Props = {
  allowPin: false,
  variant: 'secondary',
  update: mockUpdate,
  sheet: {
    ...sheet,
    info_cards: [mockItem],
  },
}

describe('DnDContentSearch', async () => {
  beforeEach(() => {
    status.value = 'success'
    data.value = { items: armorListing, pages: 1 }
    mockUpdate.mockClear()
    mockToast.mockClear()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(DnDContentSearch, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render with default props', async () => {
    const component = await mountSuspended(DnDContentSearch, { props })

    expect(component.find('[data-test-search]').exists()).toBeTruthy()
    expect(component.find('[data-test-type]').exists()).toBeTruthy()
    expect(component.find('[data-test-pin-toggle]').exists()).toBeTruthy()
    expect(component.find('[data-test-remove-pins]').exists()).toBeTruthy()
  })

  it('Should not show pin controls when sheet has no info cards', async () => {
    const component = await mountSuspended(DnDContentSearch, {
      props: {
        ...props,
        sheet: {
          ...sheet,
          info_cards: [],
        },
      },
    })

    expect(component.find('[data-test-pin-toggle]').exists()).toBeFalsy()
    expect(component.find('[data-test-remove-pins]').exists()).toBeFalsy()
  })

  it('Should show all items', async () => {
    const component = await mountSuspended(DnDContentSearch, { props })

    const grid = component.find('[data-test-content-grid]')

    expect(grid.exists()).toBeTruthy()
    expect(grid.findAllComponents({ name: 'ContentCard' })).toHaveLength(18)
  })

  it('Should show only pinned items', async () => {
    const component = await mountSuspended(DnDContentSearch, { props })

    vi.useFakeTimers()
    await component.find('[data-test-pin-toggle]').trigger('click')
    await vi.advanceTimersByTimeAsync(600)

    const grid = component.find('[data-test-content-grid]')

    expect(grid.exists()).toBeTruthy()
    expect(grid.findAllComponents({ name: 'ContentCard' })).toHaveLength(1)
  })

  it('Should handle remove pins', async () => {
    const component = await mountSuspended(DnDContentSearch, { props })

    vi.useFakeTimers()
    await component.find('[data-test-remove-pins]').trigger('click')
    await vi.advanceTimersByTimeAsync(600)

    expect(mockUpdate).toHaveBeenCalledWith({
      info_cards: [],
    })
  })

  it('Should show toast when trying to pin more than 10 items', async () => {
    const component = await mountSuspended(DnDContentSearch, {
      props: {
        ...props,
        allowPin: true,
        sheet: {
          ...sheet,
          info_cards: Array(10).fill(open5eItem),
        },
      },
    })

    vi.useFakeTimers()
    const contentCard = component.findComponent({ name: 'ContentCard' })
    await contentCard.vm.$emit('pin', open5eItem)
    await vi.advanceTimersByTimeAsync(600)

    expect(mockToast).toHaveBeenCalledWith({
      title: expect.stringMatching('components.dndContentSearch.toast.maxTitle'),
      description: expect.stringMatching('components.dndContentSearch.toast.maxText'),
      variant: 'destructive',
    })
  })

  it('Should show loading state', async () => {
    status.value = 'pending'

    const component = await mountSuspended(DnDContentSearch, { props })

    expect(component.find('[data-test-loading]').exists()).toBeTruthy()
    expect(component.find('[data-test-not-found]').exists()).toBeFalsy()
    expect(component.find('[data-test-error]').exists()).toBeFalsy()
  })

  it('Should show error state', async () => {
    status.value = 'error'

    const component = await mountSuspended(DnDContentSearch, { props })

    expect(component.text()).toContain('components.dndContentSearch.error')
    expect(component.find('[data-test-error]').exists()).toBeTruthy()
    expect(component.find('[data-test-loading]').exists()).toBeFalsy()
    expect(component.find('[data-test-not-found]').exists()).toBeFalsy()
  })

  it('Should show pagination when there are more than 1 page', async () => {
    data.value = { items: armorListing, pages: 2 }

    const component = await mountSuspended(DnDContentSearch, { props })

    expect(component.find('[data-test-pagination]').exists()).toBeTruthy()
  })

  it('Should not show pagination when there are no pages', async () => {
    data.value = { items: armorListing, pages: 0 }

    const component = await mountSuspended(DnDContentSearch, { props })

    expect(component.find('[data-test-pagination]').exists()).toBeFalsy()
  })
})
