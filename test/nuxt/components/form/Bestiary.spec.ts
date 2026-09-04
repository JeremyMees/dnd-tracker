import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useOpen5eStatus } from '~/composables/useOpen5eStatus'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Bestiary from '~/components/form/Bestiary.vue'
import MonsterCard from '~/components/molecules/MonsterCard.vue'
import SkeletonMonsterCard from '~/components/skeleton/MonsterCard.vue'
import { dndMonsterFixture } from '~~/test/fixtures/open5e'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { createInitiativeSheetProvide } from '~~/test/nuxt/stubs/initiative'
import { selectOption } from '~~/test/nuxt/stubs/popover'
import { touchArgs } from '~~/test/nuxt/stubs/queries'

const { toast } = vi.hoisted(() => ({ toast: vi.fn() }))

const monstersStatus = ref('success')
const documentsStatus = ref('success')
const data = ref<{ items: DndMonster[]; pages: number }>({
  items: [dndMonsterFixture],
  pages: 1,
})
const documents = ref<Open5eDocument[]>([])

function createDocument(key: string, gamesystem: Open5eGameSystem = '5e-2024') {
  return {
    name: key,
    key,
    url: `https://api.open5e.com/v2/documents/${key}/`,
    licenses: [],
    publisher: {
      name: 'Wizards of the Coast',
      key: 'wizards-of-the-coast',
      url: 'https://api.open5e.com/v2/publishers/wizards-of-the-coast/',
    },
    gamesystem: {
      name: gamesystem,
      key: gamesystem,
      url: `https://api.open5e.com/v2/gamesystems/${gamesystem}/`,
    },
    display_name: key,
    desc: '',
    type: 'document',
    author: 'Wizards of the Coast',
    publication_date: '2014-01-01',
    permalink: `https://example.com/${key}`,
    distance_unit: 'ft',
    weight_unit: 'lb',
  } as Open5eDocument
}

const monsterListingArgs = vi.fn()

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}))

vi.mock('~/queries/open5e', () => ({
  useOpen5eMonsterListing: (filters: ComputedRef<unknown>) => {
    monsterListingArgs(filters)
    touchArgs(filters)

    return { data, status: monstersStatus }
  },
  useOpen5eDocuments: () => ({ data: documents, status: documentsStatus }),
}))

function mountBestiary(props: Record<string, unknown> = {}) {
  const injected = createInitiativeSheetProvide()

  return {
    injected,
    mount: () => mountSuspended(Bestiary, { props, provide: injected.provide }),
  }
}

function lastFilters(): Open5eFilters {
  const arg = monsterListingArgs.mock.calls.at(-1)![0] as ComputedRef<{
    filters: Open5eFilters
  }>

  return arg.value.filters
}

const storageKey = 'dnd-tracker:filters:bestiary'

describe('Bestiary', () => {
  beforeEach(() => {
    clearNuxtState()
    monstersStatus.value = 'success'
    documentsStatus.value = 'success'
    data.value = { items: [dndMonsterFixture], pages: 1 }
    documents.value = []
    localStorage.clear()
  })

  it('Should match snapshot', async () => {
    const component = await mountBestiary().mount()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the search, challenge, sort and system filters', async () => {
    const component = await mountBestiary().mount()
    const text = component.text()

    expect(component.find('input[name="search"]').exists()).toBeTruthy()
    expect(text).toContain('components.inputs.challengeLabel')
    expect(text).toContain('components.addInitiativeMonster.sort.title')
    expect(text).toContain('components.inputs.gameSystemLabel')
  })

  it('Should render a card per monster', async () => {
    const component = await mountBestiary().mount()

    expect(component.findAllComponents(MonsterCard)).toHaveLength(1)
  })

  it('Should show skeletons while the monsters load', async () => {
    monstersStatus.value = 'pending'

    const component = await mountBestiary().mount()

    expect(component.findAllComponents(MonsterCard)).toHaveLength(0)
    expect(
      component.findAllComponents(SkeletonMonsterCard).length,
    ).toBeGreaterThan(0)
  })

  it('Should show skeletons while the documents load', async () => {
    documentsStatus.value = 'pending'

    const component = await mountBestiary().mount()

    expect(component.findAllComponents(MonsterCard)).toHaveLength(0)
  })

  it('Should show the error state when a query fails', async () => {
    monstersStatus.value = 'error'

    const component = await mountBestiary().mount()

    expect(component.text()).toContain('components.dndContentSearch.error')
  })

  it('Should not show the not found message without a search', async () => {
    data.value = { items: [], pages: 0 }

    const component = await mountBestiary().mount()

    expect(component.text()).not.toContain(
      'components.dndContentSearch.notFound',
    )
  })

  it('Should show the not found message when a search has no results', async () => {
    data.value = { items: [], pages: 0 }

    const component = await mountBestiary().mount()

    await component.get('input[name="search"]').setValue('nothing here')
    await flushPromises()

    expect(component.text()).toContain('components.dndContentSearch.notFound')
  })

  it('Should show pagination when there is more than one page', async () => {
    data.value = { items: [dndMonsterFixture], pages: 3 }

    const component = await mountBestiary().mount()

    expect(
      component.findComponent({ name: 'Pagination' }).exists(),
    ).toBeTruthy()
  })

  it('Should not show pagination for a single page', async () => {
    const component = await mountBestiary().mount()

    expect(component.findComponent({ name: 'Pagination' }).exists()).toBeFalsy()
  })

  it('Should append the monster to the rows of the sheet', async () => {
    const { injected, mount } = mountBestiary()
    const component = await mount()

    await component
      .findComponent(MonsterCard)
      .vm.$emit('add', dndMonsterFixture)
    await flushPromises()

    const rows = injected.update.mock.calls[0]![0].rows

    expect(rows).toHaveLength(sheet.rows.length + 1)
    expect(rows.at(-1)!.name).toBe(dndMonsterFixture.name)
    expect(rows.at(-1)!.type).toBe('monster')
  })

  it('Should reindex the rows after adding a monster', async () => {
    const { injected, mount } = mountBestiary()
    const component = await mount()

    await component
      .findComponent(MonsterCard)
      .vm.$emit('add', dndMonsterFixture)
    await flushPromises()

    const rows = injected.update.mock.calls[0]![0].rows

    expect(rows.map((row: InitiativeSheetRow) => row.index)).toEqual(
      rows.map((_row: InitiativeSheetRow, index: number) => index),
    )
  })

  it('Should toast after adding a monster', async () => {
    const component = await mountBestiary().mount()

    await component
      .findComponent(MonsterCard)
      .vm.$emit('add', dndMonsterFixture)
    await flushPromises()

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'success' }),
    )
  })

  it('Should not add a monster without a sheet', async () => {
    const injected = createInitiativeSheetProvide(null)

    const component = await mountSuspended(Bestiary, {
      provide: injected.provide,
    })

    await component
      .findComponent(MonsterCard)
      .vm.$emit('add', dndMonsterFixture)
    await flushPromises()

    expect(injected.update).not.toHaveBeenCalled()
    expect(toast).not.toHaveBeenCalled()
  })

  it('Should refetch with the search term once it settles', async () => {
    vi.useFakeTimers()

    const component = await mountBestiary().mount()

    await component.get('input[name="search"]').setValue('goblin')
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()

    expect(lastFilters().search).toBe('goblin')

    vi.useRealTimers()
  })

  it('Should refetch with the picked challenge rating', async () => {
    const component = await mountBestiary().mount()

    await selectOption(component, 5, { index: 0 })

    expect(lastFilters().cr).toBe(5)
  })

  it('Should refetch with the picked sort order', async () => {
    const component = await mountBestiary().mount()

    await selectOption(component, '-hit_points', { index: 1 })

    expect(lastFilters().ordering).toBe('-hit_points')
  })

  it('Should reset the search and refetch when the selected documents change', async () => {
    documents.value = [
      createDocument('srd-2024'),
      createDocument('homebrew-2024'),
    ]

    const injected = createInitiativeSheetProvide()
    const component = await mountSuspended(Bestiary, {
      provide: injected.provide,
      global: {
        stubs: { PopoverContent: { template: '<div><slot /></div>' } },
      },
    })

    await component.get('[test-id="checkbox-homebrew-2024"]').trigger('click')
    await flushPromises()

    expect(lastFilters().documents).toContain('homebrew-2024')
    expect(lastFilters().documents).toContain('srd-2024')
    expect(lastFilters().search).toBe('')
  })

  it('Should refetch when the selected game system changes', async () => {
    const injected = createInitiativeSheetProvide()
    const component = await mountSuspended(Bestiary, {
      provide: injected.provide,
      global: {
        stubs: { PopoverContent: { template: '<div><slot /></div>' } },
      },
    })

    await component.findAll('button[role="radio"]')[0]!.trigger('click')
    await flushPromises()

    expect(lastFilters().documents).toEqual(['srd-2014'])
  })

  it('Should refetch with the picked page from pagination', async () => {
    data.value = { items: [dndMonsterFixture], pages: 3 }

    const component = await mountBestiary().mount()

    await component
      .findComponent({ name: 'Pagination' })
      .vm.$emit('update:page', 2)
    await flushPromises()

    expect(lastFilters().page).toBe(2)
  })

  it('Should reset the page when the filters change', async () => {
    data.value = { items: [dndMonsterFixture], pages: 3 }

    const component = await mountBestiary().mount()

    await component
      .findComponent({ name: 'Pagination' })
      .vm.$emit('update:page', 2)
    await flushPromises()

    expect(lastFilters().page).toBe(2)

    await selectOption(component, 5, { index: 0 })

    expect(lastFilters().page).toBe(0)
  })

  it('Should not persist the filters by default', async () => {
    const component = await mountBestiary().mount()

    await selectOption(component, 5, { index: 0 })

    expect(localStorage.getItem(storageKey)).toBeNull()
  })

  it('Should restore the filters from the storage', async () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        search: 'goblin',
        cr: 5,
        sortBy: '-hit_points',
        page: 2,
      }),
    )

    const component = await mountBestiary({ persist: 'local' }).mount()

    expect(component.get('input[name="search"]').element).toHaveProperty(
      'value',
      'goblin',
    )
    expect(lastFilters().search).toBe('goblin')
    expect(lastFilters().cr).toBe(5)
    expect(lastFilters().ordering).toBe('-hit_points')
    expect(lastFilters().page).toBe(2)
  })

  it('Should drop a stored challenge rating that is not an option', async () => {
    localStorage.setItem(storageKey, JSON.stringify({ cr: 999 }))

    await mountBestiary({ persist: 'local' }).mount()

    expect(lastFilters().cr).toBeUndefined()
  })

  it('Should write the filters to the storage', async () => {
    const component = await mountBestiary({ persist: 'local' }).mount()

    await selectOption(component, 5, { index: 0 })

    expect(JSON.parse(localStorage.getItem(storageKey) ?? '{}')).toMatchObject({
      cr: 5,
    })
  })

  it('Should scroll to the top card when paginating', async () => {
    data.value = { items: [dndMonsterFixture], pages: 3 }

    const component = await mountBestiary().mount()

    document.body.appendChild(component.element)

    const scrollIntoView = vi.fn()
    const el = component.find('#el').element as HTMLElement
    el.scrollIntoView = scrollIntoView

    await component
      .findComponent({ name: 'Pagination' })
      .vm.$emit('paginate', 1)
    await flushPromises()

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'end',
    })

    component.element.remove()
  })

  describe('reset filters', () => {
    it('Should not show the reset button while the filters are untouched', async () => {
      const component = await mountBestiary().mount()

      expect(component.find('[test-id="reset-filters"]').exists()).toBeFalsy()
    })

    it('Should show the reset button when the search changes', async () => {
      const component = await mountBestiary().mount()

      await component.get('input[name="search"]').setValue('goblin')

      expect(component.find('[test-id="reset-filters"]').exists()).toBeTruthy()
    })

    it('Should show the reset button when the challenge rating changes', async () => {
      const component = await mountBestiary().mount()

      await selectOption(component, 5, { index: 0 })

      expect(component.find('[test-id="reset-filters"]').exists()).toBeTruthy()
    })

    it('Should show the reset button when the sort order changes', async () => {
      const component = await mountBestiary().mount()

      await selectOption(component, '-hit_points', { index: 1 })

      expect(component.find('[test-id="reset-filters"]').exists()).toBeTruthy()
    })

    it('Should show the reset button when the selected documents change', async () => {
      documents.value = [
        createDocument('srd-2024'),
        createDocument('homebrew-2024'),
      ]

      const injected = createInitiativeSheetProvide()
      const component = await mountSuspended(Bestiary, {
        provide: injected.provide,
        global: {
          stubs: { PopoverContent: { template: '<div><slot /></div>' } },
        },
      })

      await component.get('[test-id="checkbox-homebrew-2024"]').trigger('click')
      await flushPromises()

      expect(component.find('[test-id="reset-filters"]').exists()).toBeTruthy()
    })

    it('Should show the reset button when the game system changes', async () => {
      const injected = createInitiativeSheetProvide()
      const component = await mountSuspended(Bestiary, {
        provide: injected.provide,
        global: {
          stubs: { PopoverContent: { template: '<div><slot /></div>' } },
        },
      })

      await component.findAll('button[role="radio"]')[0]!.trigger('click')
      await flushPromises()

      expect(component.find('[test-id="reset-filters"]').exists()).toBeTruthy()
    })

    it('Should restore every filter to its initial value', async () => {
      vi.useFakeTimers()

      const component = await mountBestiary().mount()

      await component.get('input[name="search"]').setValue('goblin')
      await selectOption(component, 5, { index: 0 })
      await selectOption(component, '-hit_points', { index: 1 })
      await vi.advanceTimersByTimeAsync(1000)
      await flushPromises()

      await component.get('[test-id="reset-filters"]').trigger('click')
      await vi.advanceTimersByTimeAsync(1000)
      await flushPromises()

      expect(component.get('input[name="search"]').element).toHaveProperty(
        'value',
        '',
      )
      expect(lastFilters().search).toBe('')
      expect(lastFilters().cr).toBeUndefined()
      expect(lastFilters().ordering).toBe('name')
      expect(lastFilters().documents).toEqual(['srd-2024'])
      expect(component.find('[test-id="reset-filters"]').exists()).toBeFalsy()

      vi.useRealTimers()
    })

    it('Should clear a pending debounced search when resetting', async () => {
      vi.useFakeTimers()

      const component = await mountBestiary().mount()

      await component.get('input[name="search"]').setValue('goblin')
      await component.get('[test-id="reset-filters"]').trigger('click')
      await vi.advanceTimersByTimeAsync(1000)
      await flushPromises()

      expect(lastFilters().search).toBe('')

      vi.useRealTimers()
    })
  })

  it('Should not warn about stale content while open5e is healthy', async () => {
    const component = await mountBestiary().mount()

    expect(component.find('[test-id="open5e-stale"]').exists()).toBeFalsy()
  })

  it('Should warn when the content came from our own cache', async () => {
    useOpen5eStatus().trackOpen5eFreshness('2026-09-04T12:00:00.000Z')

    const component = await mountBestiary().mount()

    expect(component.find('[test-id="open5e-stale"]').exists()).toBeTruthy()
  })
})
