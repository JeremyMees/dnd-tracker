import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Table from '~/components/initiative/Table.vue'
import { sheet } from '~~/test/unit/fixtures/initiative-sheet'
import conditions from '~~/test/unit/fixtures/conditions.json'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

interface Props {
  loading: boolean
}

const mockUpdate = vi.fn()
const mockSheet = ref<InitiativeSheet | undefined>(sheet)
const mockActiveRow = ref<InitiativeSheetRow | undefined>()

const provide = {
  [INITIATIVE_SHEET]: {
    sheet: mockSheet,
    update: mockUpdate,
    activeRow: mockActiveRow,
  },
}

const props: Props = {
  loading: false,
}

vi.mock('~~/queries/open5e', () => ({
  prefetchConditionsListing: () => Promise.resolve(),
  useConditionsListing: () => ({
    data: conditions,
    isLoading: false,
    isError: false,
  }),
}))

vi.mock('~~/composables/initiative-sheet', () => ({
  useInitiativeSheet: (data: any, update: any) => {
    const expanded = ref({})
    const selected = ref({})
    const active = computed(() => {
      const selectedRowId = Object.keys(selected.value).find(key => selected.value[key] === true)
      return data.value?.rows.find((row: any) => row.id === selectedRowId)
    })
    const columnVisibility = computed(() => {
      const rows = data.value?.settings?.modified
        ? (data.value.settings.rows || [])
        : ['ac', 'health', 'conditions', 'note', 'deathSaves', 'concentration', 'modify']

      return {
        index: true,
        name: true,
        initiative: true,
        ac: rows.includes('ac'),
        health: rows.includes('health'),
        conditions: rows.includes('conditions'),
        note: rows.includes('note'),
        deathSaves: rows.includes('deathSaves'),
        concentration: rows.includes('concentration'),
        modify: rows.includes('modify'),
      }
    })

    return {
      previous: vi.fn(),
      next: vi.fn(),
      reset: vi.fn(),
      active,
      expanded,
      selected,
      columnVisibility,
    }
  },
}))

describe('Initiative table', () => {
  beforeEach(() => {
    mockSheet.value = sheet
    mockUpdate.mockClear()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Table, { props, provide })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should display table rows when data is available', async () => {
    const component = await mountSuspended(Table, { props, provide })

    expect(component.findAll('[data-test-row]').length).toBe(sheet.rows.length)
  })

  it('Should display loading state when loading is true', async () => {
    mockSheet.value = {
      ...sheet,
      rows: [],
    }

    const component = await mountSuspended(Table, {
      props: { loading: true },
      provide,
    })

    expect(component.findAll('[data-test-loading]').length).toBe(10)
  })

  it('Should display empty state when no data is available', async () => {
    mockSheet.value = undefined

    const component = await mountSuspended(Table, {
      props: { ...props },
      provide,
    })

    expect(component.find('[data-test-empty-state]').exists()).toBeTruthy()
  })

  it('Should display widgets section', async () => {
    const component = await mountSuspended(Table, { props, provide })

    expect(component.find('[data-test-widgets]').exists()).toBeTruthy()
  })

  describe('Table padding', () => {
    it('Should handle compact spacing', async () => {
      mockSheet.value = {
        ...sheet,
        settings: {
          ...sheet.settings,
          spacing: 'compact',
        } as InitiativeSheet['settings'],
      }

      const component = await mountSuspended(Table, { props, provide })

      expect(component.findAll('.p-1').length).toBeGreaterThan(0)
    })

    it('Should handle cozy spacing', async () => {
      mockSheet.value = {
        ...sheet,
        settings: {
          ...sheet.settings,
          spacing: 'cozy',
        } as InitiativeSheet['settings'],
      }

      const component = await mountSuspended(Table, { props, provide })

      expect(component.findAll('.p-4').length).toBeGreaterThan(0)
    })

    it('Should handle normal spacing', async () => {
      const component = await mountSuspended(Table, { props, provide })

      expect(component.findAll('.p-2').length).toBeGreaterThan(0)
    })
  })

  describe('Column visibility', () => {
    it('Should show all columns by default', async () => {
      const component = await mountSuspended(Table, { props, provide })

      expect(component.findAll('[data-test-header]').length).toBe(10)
    })

    it('Should hide columns based on settings', async () => {
      mockSheet.value = {
        ...sheet,
        settings: {
          ...sheet.settings,
          modified: true,
          rows: ['index', 'name', 'initiative', 'ac', 'health'],
        } as InitiativeSheet['settings'],
      }

      const component = await mountSuspended(Table, { props, provide })

      expect(component.findAll('[data-test-header]').length).toBe(5)
    })

    it('Should update visible columns when settings change', async () => {
      const component = await mountSuspended(Table, { props, provide })

      expect(component.findAll('[data-test-header]').length).toBe(10)

      mockSheet.value = {
        ...sheet,
        settings: {
          ...sheet.settings,
          modified: true,
          rows: ['index', 'name', 'initiative'],
        } as InitiativeSheet['settings'],
      }

      const updatedComponent = await mountSuspended(Table, { props, provide })

      expect(updatedComponent.findAll('[data-test-header]').length).toBe(3)
    })

    it('Should maintain column visibility state after row expansion', async () => {
      mockSheet.value = {
        ...sheet,
        settings: {
          ...sheet.settings,
          modified: true,
          rows: ['index', 'name', 'initiative'],
        } as InitiativeSheet['settings'],
      }

      const component = await mountSuspended(Table, { props, provide })

      const firstRow = component.find('[data-test-row]')
      const expandButton = firstRow.find('button[arialabel="actions.show"]')

      await expandButton.trigger('click')

      expect(component.findAll('[data-test-header]').length).toBe(3)
    })
  })

  it('Should handle row selection', async () => {
    const component = await mountSuspended(Table, { props, provide })

    const firstRow = component.find('[data-test-row]')
    await firstRow.trigger('click')

    expect(firstRow.attributes('data-state')).toBe('selected')
  })

  it('Should handle row expansion', async () => {
    const component = await mountSuspended(Table, { props, provide })

    const firstRow = component.find('[data-test-row]')
    const expandButton = firstRow.find('button[arialabel="actions.show"]')

    await expandButton.trigger('click')

    expect(component.find('[data-test-expanded]').exists()).toBeTruthy()
  })
})
