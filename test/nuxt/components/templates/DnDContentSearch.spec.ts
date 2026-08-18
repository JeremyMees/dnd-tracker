import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import DnDContentSearch from '~/components/templates/DnDContentSearch.vue'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import {
  dndArmorFixture,
  open5eV2ArmorListingFixture,
} from '~~/test/fixtures/open5e'
import { selectOption } from '~~/test/nuxt/stubs/popover'

interface Props {
  variant?: 'secondary' | 'background'
  sheet?: InitiativeSheet
  update?: (
    payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>,
  ) => Promise<void>
  allowPin?: boolean
}

const mockUpdate = vi.fn()
const mockToast = vi.fn()

const mockItem = dndArmorFixture
const status = ref('success')
const data = ref<{ items: unknown[]; pages: number }>({
  items: open5eV2ArmorListingFixture,
  pages: 1,
})

let filterRef:
  ComputedRef<{ type: Open5eType; filters: Open5eFilters }> | undefined

const { scrollToIdMock } = vi.hoisted(() => ({ scrollToIdMock: vi.fn() }))

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

vi.mock('~/utils/ui-helpers', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  scrollToId: scrollToIdMock,
}))

vi.mock('~/queries/open5e', () => ({
  useOpen5eListing: (
    filters: ComputedRef<{ type: Open5eType; filters: Open5eFilters }>,
  ) => {
    filterRef = filters

    return { data, status }
  },
  useOpen5eDocuments: () => ({ data: ref([]), status: ref('success') }),
}))

const props: Props = {
  allowPin: false,
  variant: 'secondary',
  update: mockUpdate,
  sheet: {
    ...sheet,
    infoCards: [mockItem],
  },
}

describe('DnDContentSearch', async () => {
  beforeEach(() => {
    status.value = 'success'
    data.value = { items: open5eV2ArmorListingFixture, pages: 1 }
    mockUpdate.mockClear()
    mockToast.mockClear()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(DnDContentSearch, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render with default props', async () => {
    const component = await mountSuspended(DnDContentSearch, { props })

    expect(component.find('[test-id="search"]').exists()).toBeTruthy()
    expect(component.find('[test-id="type"]').exists()).toBeTruthy()
    expect(component.find('[test-id="pin-toggle"]').exists()).toBeTruthy()
    expect(component.find('[test-id="remove-pins"]').exists()).toBeTruthy()
  })

  it('Should not show pin controls when sheet has no info cards', async () => {
    const component = await mountSuspended(DnDContentSearch, {
      props: {
        ...props,
        sheet: {
          ...sheet,
          infoCards: [],
        },
      },
    })

    expect(component.find('[test-id="pin-toggle"]').exists()).toBeFalsy()
    expect(component.find('[test-id="remove-pins"]').exists()).toBeFalsy()
  })

  it('Should show all items', async () => {
    const component = await mountSuspended(DnDContentSearch, { props })

    const grid = component.find('[test-id="content-grid"]')

    expect(grid.exists()).toBeTruthy()
    expect(grid.findAllComponents({ name: 'ContentCard' })).toHaveLength(
      open5eV2ArmorListingFixture.length,
    )
  })

  it('Should show only pinned items', async () => {
    const component = await mountSuspended(DnDContentSearch, { props })

    vi.useFakeTimers()
    await component.find('[test-id="pin-toggle"]').trigger('click')
    await vi.advanceTimersByTimeAsync(600)

    const grid = component.find('[test-id="content-grid"]')

    expect(grid.exists()).toBeTruthy()
    expect(grid.findAllComponents({ name: 'ContentCard' })).toHaveLength(1)
  })

  it('Should handle remove pins', async () => {
    const component = await mountSuspended(DnDContentSearch, { props })

    vi.useFakeTimers()
    await component.find('[test-id="remove-pins"]').trigger('click')
    await vi.advanceTimersByTimeAsync(600)

    expect(mockUpdate).toHaveBeenCalledWith({
      infoCards: [],
    })
  })

  it('Should show toast when trying to pin more than 10 items', async () => {
    const component = await mountSuspended(DnDContentSearch, {
      props: {
        ...props,
        allowPin: true,
        sheet: {
          ...sheet,
          infoCards: Array(10).fill(dndArmorFixture),
        },
      },
    })

    vi.useFakeTimers()
    const contentCard = component.findComponent({ name: 'ContentCard' })
    await contentCard.vm.$emit('pin', dndArmorFixture)
    await vi.advanceTimersByTimeAsync(600)

    expect(mockToast).toHaveBeenCalledWith({
      title: expect.stringMatching(
        'components.dndContentSearch.toast.maxTitle',
      ),
      description: expect.stringMatching(
        'components.dndContentSearch.toast.maxText',
      ),
      variant: 'destructive',
    })
  })

  it('Should show loading state', async () => {
    status.value = 'pending'

    const component = await mountSuspended(DnDContentSearch, { props })

    expect(component.find('[test-id="loading"]').exists()).toBeTruthy()
    expect(component.find('[test-id="not-found"]').exists()).toBeFalsy()
    expect(component.find('[test-id="error"]').exists()).toBeFalsy()
  })

  it('Should show error state', async () => {
    status.value = 'error'

    const component = await mountSuspended(DnDContentSearch, { props })

    expect(component.text()).toContain('components.dndContentSearch.error')
    expect(component.find('[test-id="error"]').exists()).toBeTruthy()
    expect(component.find('[test-id="loading"]').exists()).toBeFalsy()
    expect(component.find('[test-id="not-found"]').exists()).toBeFalsy()
  })

  it('Should show pagination when there are more than 1 page', async () => {
    data.value = { items: open5eV2ArmorListingFixture, pages: 2 }

    const component = await mountSuspended(DnDContentSearch, { props })

    expect(component.find('[test-id="pagination"]').exists()).toBeTruthy()
  })

  it('Should not show pagination when there are no pages', async () => {
    data.value = { items: open5eV2ArmorListingFixture, pages: 0 }

    const component = await mountSuspended(DnDContentSearch, { props })

    expect(component.find('[test-id="pagination"]').exists()).toBeFalsy()
  })

  it('Should not show pagination while pinned items are shown', async () => {
    data.value = { items: open5eV2ArmorListingFixture, pages: 2 }

    const component = await mountSuspended(DnDContentSearch, { props })

    vi.useFakeTimers()
    await component.find('[test-id="pin-toggle"]').trigger('click')
    await vi.advanceTimersByTimeAsync(600)

    expect(component.find('[test-id="pagination"]').exists()).toBeFalsy()
  })

  it('Should use the background pagination styles for the background variant', async () => {
    data.value = { items: open5eV2ArmorListingFixture, pages: 2 }

    const component = await mountSuspended(DnDContentSearch, {
      props: { ...props, variant: 'background' },
    })

    expect(
      component.findComponent({ name: 'Pagination' }).props('styles'),
    ).toContain('bg-background')
  })

  it('Should scroll to the results anchor when paginating', async () => {
    data.value = { items: open5eV2ArmorListingFixture, pages: 2 }

    const component = await mountSuspended(DnDContentSearch, { props })

    await component.findComponent({ name: 'Pagination' }).vm.$emit('paginate')

    expect(scrollToIdMock).toHaveBeenCalledWith('el')
  })

  it('Should update the page when the pagination emits a new page', async () => {
    data.value = { items: open5eV2ArmorListingFixture, pages: 2 }

    const component = await mountSuspended(DnDContentSearch, { props })

    await component
      .findComponent({ name: 'Pagination' })
      .vm.$emit('update:page', 1)

    expect(filterRef?.value.filters.page).toBe(1)
  })

  it('Should show the not found message when the search has no results', async () => {
    data.value = { items: [], pages: 0 }

    const component = await mountSuspended(DnDContentSearch, { props })

    await component.get('[test-id="search"]').setValue('nothing here')

    expect(component.find('[test-id="not-found"]').exists()).toBeTruthy()
  })

  it('Should debounce the search query filters', async () => {
    const component = await mountSuspended(DnDContentSearch, { props })

    vi.useFakeTimers()
    await component.get('[test-id="search"]').setValue('sword')
    await vi.advanceTimersByTimeAsync(600)

    expect(filterRef?.value.filters.name__icontains).toBe('sword')
  })

  it('Should reset the search and query filters when the content type changes', async () => {
    const component = await mountSuspended(DnDContentSearch, { props })

    vi.useFakeTimers()
    await component.get('[test-id="search"]').setValue('sword')
    await vi.advanceTimersByTimeAsync(600)

    await selectOption(component, 'weapons')

    expect(component.get('[test-id="search"]').element).toHaveProperty(
      'value',
      '',
    )
    expect(filterRef?.value.filters.name__icontains).toBe('')
    expect(filterRef?.value.filters.ordering).toBe('name')
    expect(filterRef?.value.type).toBe('weapons')
  })

  it('Should reset the query filters when the selected documents change', async () => {
    const component = await mountSuspended(DnDContentSearch, { props })

    await component
      .findComponent({ name: 'GameSystemFilter' })
      .vm.$emit('update:document', ['srd-2014'])

    expect(filterRef?.value.filters.document__key__in).toBe('srd-2014')
  })

  it('Should reset the query filters when the selected game system changes', async () => {
    const component = await mountSuspended(DnDContentSearch, { props })

    await component
      .findComponent({ name: 'GameSystemFilter' })
      .vm.$emit('update:system', '5e-2014')

    expect(filterRef?.value.filters.name__icontains).toBe('')
    expect(filterRef?.value.filters.ordering).toBe('name')
  })

  it('Should mark a hit as pinned when it exists in the sheet infoCards', async () => {
    data.value = {
      items: [
        { ...open5eV2ArmorListingFixture[0], id: mockItem.id },
        ...open5eV2ArmorListingFixture.slice(1),
      ],
      pages: 1,
    }

    const component = await mountSuspended(DnDContentSearch, { props })
    const pinnedCard = component
      .findAllComponents({ name: 'ContentCard' })
      .find(card => (card.props('hit') as { id?: string }).id === mockItem.id)

    expect(pinnedCard!.props('pinned')).toBe(true)
  })

  it('Should pin a new item when there is room left', async () => {
    const component = await mountSuspended(DnDContentSearch, {
      props: { ...props, allowPin: true },
    })

    vi.useFakeTimers()
    const contentCard = component
      .findAllComponents({ name: 'ContentCard' })
      .find(
        card =>
          (card.props('hit') as { key?: string }).key ===
          open5eV2ArmorListingFixture[1]!.key,
      )
    await contentCard!.vm.$emit('pin')
    await vi.advanceTimersByTimeAsync(600)

    expect(mockUpdate).toHaveBeenCalledWith({
      infoCards: [mockItem, open5eV2ArmorListingFixture[1]],
    })
    expect(mockToast).not.toHaveBeenCalled()
  })

  it('Should unpin an item', async () => {
    data.value = {
      items: [
        { ...open5eV2ArmorListingFixture[0], id: mockItem.id },
        ...open5eV2ArmorListingFixture.slice(1),
      ],
      pages: 1,
    }

    const component = await mountSuspended(DnDContentSearch, {
      props: { ...props, allowPin: true },
    })

    vi.useFakeTimers()
    const contentCard = component
      .findAllComponents({ name: 'ContentCard' })
      .find(card => card.props('pinned') === true)
    await contentCard!.vm.$emit('unpin')
    await vi.advanceTimersByTimeAsync(600)

    expect(mockUpdate).toHaveBeenCalledWith({ infoCards: [] })
  })

  it('Should not pin or unpin without a sheet or update handler', async () => {
    const component = await mountSuspended(DnDContentSearch, {
      props: {},
    })

    const contentCard = component.findComponent({ name: 'ContentCard' })
    await contentCard.vm.$emit('pin', open5eV2ArmorListingFixture[0])

    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('Should not remove pins without a sheet or update handler', async () => {
    const component = await mountSuspended(DnDContentSearch, {
      props: {},
    })

    interface DnDContentSearchVm {
      removePins: () => Promise<void>
    }

    await (component.vm as unknown as DnDContentSearchVm).removePins()

    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
