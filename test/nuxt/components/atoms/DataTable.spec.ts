import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { ColumnDef, Row, TableOptions } from '@tanstack/vue-table'
import { createColumnHelper } from '@tanstack/vue-table'
import { describe, expect, it, vi } from 'vitest'
import DataTable from '~/components/atoms/DataTable.vue'
import { expandButton, selectButton } from '~~/tables/generate-functions'

interface TestData {
  id: number
  name: string
  age: number
}

const mockData: TestData[] = [
  { id: 1, name: 'John Doe', age: 30 },
  { id: 2, name: 'Jane Smith', age: 25 },
  { id: 3, name: 'Bob Johnson', age: 40 },
]

const columnHelper = createColumnHelper<TestData>()

const mockColumns: ColumnDef<TestData>[] = [
  columnHelper.display({
    id: 'checkbox',
    header: '',
    cell: ({ row }) => row.getCanSelect()
      ? selectButton({ checked: row.getIsSelected(), cb: row.getToggleSelectedHandler(), disabled: false })
      : null,
  }),
  columnHelper.display({
    id: 'expand',
    header: '',
    cell: ({ row }) => expandButton({
      content: `actions.${row.getIsExpanded() ? 'hide' : 'show'}`,
      expanded: row.getIsExpanded(),
      cb: () => row.toggleExpanded(),
    }),
  }),
  columnHelper.accessor('id', {
    header: 'ID',
    cell: ({ row }) => row.getValue('id'),
  }) as ColumnDef<TestData>,
  columnHelper.accessor('name', {
    header: 'Name',
    cell: ({ row }) => row.getValue('name'),
  }) as ColumnDef<TestData>,
  columnHelper.accessor('age', {
    header: 'Age',
    cell: ({ row }) => row.getValue('age'),
  }) as ColumnDef<TestData>,
]

interface Props {
  columns: ColumnDef<any, any>[]
  data: any[]
  loading: boolean
  options?: Partial<TableOptions<any>>
  emptyMessage?: string
  permission?: boolean | ((item: any) => Promise<boolean>)
  expandedMarkup?: (row: Row<any>) => VNode
}

const props: Props = {
  columns: mockColumns,
  data: mockData,
  loading: false,
  options: { pageCount: 1 },
  emptyMessage: 'No data available',
  permission: true,
  expandedMarkup: row => h('div', { class: 'expanded-row' }, `Details for ${row.original.name}`),
}

describe('DataTable', () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(DataTable, { props })
    expect(component.html()).toMatchSnapshot()
  })

  it('Should render table with correct data', async () => {
    const component = await mountSuspended(DataTable, { props })

    const headers = component.findAll('th')
    expect(headers.length).toBe(5)
    expect(headers[0]!.text()).toBe('')
    expect(headers[1]!.text()).toBe('')
    expect(headers[2]!.text()).toContain('ID')
    expect(headers[3]!.text()).toContain('Name')
    expect(headers[4]!.text()).toContain('Age')

    const rows = component.findAll('tbody tr')
    expect(rows.length).toBe(3)

    const firstRowCells = rows[0]!.findAll('td')
    expect(firstRowCells[2]!.text()).toContain('1')
    expect(firstRowCells[3]!.text()).toContain('John Doe')
    expect(firstRowCells[4]!.text()).toContain('30')

    expect(component.find('[data-test-empty]').exists()).toBeFalsy()
  })

  it('Should show loading state correctly', async () => {
    const component = await mountSuspended(DataTable, {
      props: { ...props, loading: true, data: [] },
      slots: {
        loading: () => h('div', 'Loading'),
      },
    })

    expect(component.html()).toContain('<div>Loading</div>')
  })

  it('Should show empty message when no data', async () => {
    const component = await mountSuspended(DataTable, { props: { ...props, data: [] } })

    const empty = component.find('[data-test-empty]')
    expect(empty.exists()).toBeTruthy()
    expect(empty.text()).toBe(props.emptyMessage)
  })

  it('Should emit remove event when bulk remove button is clicked', async () => {
    const component = await mountSuspended(DataTable, { props })

    const checkbox = component.find('button[role="checkbox"]')
    expect(checkbox.exists()).toBeTruthy()
    await checkbox.trigger('click')
    await nextTick()

    const removeButton = component.find('[data-test-remove]')
    expect(removeButton.exists()).toBeTruthy()
    await removeButton.trigger('click')

    const emitted = component.emitted()
    expect(emitted.remove).toBeTruthy()
    expect(emitted.remove![0]).toEqual([[1]])
  })

  it('Should handle row expansion correctly', async () => {
    const component = await mountSuspended(DataTable, { props })

    let expansionButton = component.find('button[arialabel="actions.show"]')
    expect(expansionButton.exists()).toBeTruthy()
    await expansionButton.trigger('click')
    await nextTick()

    let expandedContent = component.find('.expanded-row')
    expect(expandedContent.exists()).toBeTruthy()
    expect(expandedContent.text()).toContain('Details for John Doe')

    expansionButton = component.find('button[arialabel="actions.hide"]')
    expect(expansionButton.exists()).toBeTruthy()
    await expansionButton.trigger('click')
    await nextTick()

    expandedContent = component.find('.expanded-row')
    expect(expandedContent.exists()).toBeFalsy()
  })

  it('Should handle pagination correctly', async () => {
    const paginationProps = {
      ...props,
      options: {
        pageCount: 3,
        initialState: {
          pagination: {
            pageIndex: 0,
            pageSize: 1,
          },
        },
      },
    }

    const component = await mountSuspended(DataTable, { props: paginationProps })

    let paginationText = component.find('[data-test-pagination="1"]')
    expect(paginationText.exists()).toBeTruthy()

    const nextButton = component.find('button[data-test-pagination-next]')
    expect(nextButton.exists()).toBeTruthy()
    await nextButton.trigger('click')
    await nextTick()

    paginationText = component.find('[data-test-pagination="2"]')
    expect(paginationText.exists()).toBeTruthy()

    const prevButton = component.find('button[data-test-pagination-prev]')
    expect(prevButton.exists()).toBeTruthy()
    await prevButton.trigger('click')
    await nextTick()

    paginationText = component.find('[data-test-pagination="1"]')
    expect(paginationText.exists()).toBeTruthy()
  })

  it('Should handle custom permissions correctly', async () => {
    const permissionFn = vi.fn().mockImplementation(item => Promise.resolve(item.id === 1))

    const component = await mountSuspended(DataTable, {
      props: {
        ...props,
        permission: permissionFn,
      },
    })

    expect(permissionFn).toHaveBeenCalledTimes(3)
    expect(permissionFn).toHaveBeenCalledWith(mockData[0])
    expect(permissionFn).toHaveBeenCalledWith(mockData[1])
    expect(permissionFn).toHaveBeenCalledWith(mockData[2])

    const checkboxes = component.findAll('button[role="checkbox"]')
    expect(checkboxes.length).toBe(1)
  })
})
