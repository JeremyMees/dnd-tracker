import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import type { ColumnDef, Row, TableOptions } from '@tanstack/vue-table'
import { createColumnHelper } from '@tanstack/vue-table'
import { describe, expect, it, vi } from 'vitest'
import DataTable from '~/components/atoms/DataTable.vue'
import type { ListingFeatures } from '~/tables/features'
import { expandButton, selectButton } from '~/tables/generate-functions'

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

const TypedDataTable = DataTable<TestData>

const columnHelper = createColumnHelper<ListingFeatures, TestData>()

const mockColumns = columnHelper.columns([
  columnHelper.display({
    id: 'checkbox',
    header: '',
    cell: ({ row }) =>
      row.getCanSelect()
        ? selectButton({
            checked: row.getIsSelected(),
            cb: row.getToggleSelectedHandler(),
            disabled: false,
          })
        : null,
  }),
  columnHelper.display({
    id: 'expand',
    header: '',
    cell: ({ row }) =>
      expandButton({
        content: `actions.${row.getIsExpanded() ? 'hide' : 'show'}`,
        expanded: row.getIsExpanded(),
        cb: () => row.toggleExpanded(),
      }),
  }),
  columnHelper.accessor('id', {
    header: 'ID',
    cell: ({ row }) => row.getValue('id'),
  }),
  columnHelper.accessor('name', {
    header: 'Name',
    cell: ({ row }) => row.getValue('name'),
  }),
  columnHelper.accessor('age', {
    header: 'Age',
    cell: ({ row }) => row.getValue('age'),
  }),
])

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<ListingFeatures, TestData, any>[]
  data: TestData[]
  loading: boolean
  options?: Partial<TableOptions<ListingFeatures, TestData>>
  emptyMessage?: string
  permission?: boolean | ((item: TestData) => Promise<boolean>)
  expandedMarkup?: (row: Row<ListingFeatures, TestData>) => VNode
}

const props: Props = {
  columns: mockColumns,
  data: mockData,
  loading: false,
  options: { pageCount: 1 },
  emptyMessage: 'No data available',
  permission: true,
  expandedMarkup: row =>
    h('div', { class: 'expanded-row' }, `Details for ${row.original.name}`),
}

describe('DataTable', () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(TypedDataTable, { props })
    expect(component.html()).toMatchSnapshot()
  })

  it('Should render table with correct data', async () => {
    const component = await mountSuspended(TypedDataTable, { props })

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

    expect(component.find('[test-id="empty"]').exists()).toBeFalsy()
  })

  it('Should show loading state correctly', async () => {
    const component = await mountSuspended(TypedDataTable, {
      props: { ...props, loading: true, data: [] },
      slots: {
        loading: () => h('div', 'Loading'),
      },
    })

    expect(component.html()).toContain('<div>Loading</div>')
  })

  it('Should show empty message when no data', async () => {
    const component = await mountSuspended(TypedDataTable, {
      props: { ...props, data: [] },
    })

    const empty = component.find('[test-id="empty"]')
    expect(empty.exists()).toBeTruthy()
    expect(empty.text()).toBe(props.emptyMessage)
  })

  it('Should emit remove event when bulk remove button is clicked', async () => {
    const component = await mountSuspended(TypedDataTable, { props })

    const checkbox = component.find('button[role="checkbox"]')
    expect(checkbox.exists()).toBeTruthy()
    await checkbox.trigger('click')
    await nextTick()

    const removeButton = component.find('[test-id="remove"]')
    expect(removeButton.exists()).toBeTruthy()
    await removeButton.trigger('click')

    const emitted = component.emitted()
    expect(emitted.remove).toBeTruthy()
    expect(emitted.remove![0]).toEqual([[1]])
  })

  it('Should handle row expansion correctly', async () => {
    const component = await mountSuspended(TypedDataTable, { props })

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

    const component = await mountSuspended(TypedDataTable, {
      props: paginationProps,
    })

    let paginationText = component.find('[test-id="1"]')
    expect(paginationText.exists()).toBeTruthy()

    const nextButton = component.find('button[test-id="pagination-next"]')
    expect(nextButton.exists()).toBeTruthy()
    await nextButton.trigger('click')
    await nextTick()

    paginationText = component.find('[test-id="2"]')
    expect(paginationText.exists()).toBeTruthy()

    const prevButton = component.find('button[test-id="pagination-prev"]')
    expect(prevButton.exists()).toBeTruthy()
    await prevButton.trigger('click')
    await nextTick()

    paginationText = component.find('[test-id="1"]')
    expect(paginationText.exists()).toBeTruthy()
  })

  it('Should sort by column and emit invalidate when a sortable header is clicked', async () => {
    const component = await mountSuspended(TypedDataTable, { props })

    const headers = component.findAll('th')
    const nameHeader = headers[3]!

    await nameHeader.trigger('click')
    await nextTick()

    expect(component.emitted('invalidate')).toBeTruthy()
    expect(nameHeader.find('.iconify').exists()).toBeTruthy()

    await nameHeader.trigger('click')
    await nextTick()

    expect(component.emitted('invalidate')!.length).toBe(2)
  })

  it('Should emit invalidate when the search input triggers a global filter change', async () => {
    const component = await mountSuspended(TypedDataTable, { props })

    await component.find('input[type="search"]').setValue('John')
    await nextTick()

    expect(component.emitted('invalidate')).toBeTruthy()
  })

  it('Should default row permissions to true when no permission prop is given', async () => {
    const component = await mountSuspended(TypedDataTable, {
      props: { ...props, permission: undefined },
    })

    const checkboxes = component.findAll('button[role="checkbox"]')
    expect(checkboxes.length).toBe(mockData.length)
  })

  it('Should disable row selection while permissions are still being fetched', async () => {
    const pendingPermissionFn = vi.fn(() => new Promise<boolean>(() => {}))

    const component = await mountSuspended(TypedDataTable, {
      props: { ...props, permission: pendingPermissionFn },
    })

    const checkboxes = component.findAll('button[role="checkbox"]')
    expect(checkboxes.length).toBe(0)
  })

  it('Should discard a stale permission fetch that resolves after a newer one', async () => {
    let resolveStale: (value: boolean) => void = () => {}
    const stalePromise = new Promise<boolean>(resolve => {
      resolveStale = resolve
    })

    const permissionFn = vi
      .fn()
      .mockImplementationOnce(() => stalePromise)
      .mockImplementation(() => Promise.resolve(true))

    const component = await mountSuspended(TypedDataTable, {
      props: { ...props, data: [mockData[0]!], permission: permissionFn },
    })

    await component.setProps({ data: [mockData[0]!, mockData[1]!] })
    await flushPromises()

    resolveStale(false)
    await flushPromises()

    const checkboxes = component.findAll('button[role="checkbox"]')
    expect(checkboxes.length).toBe(2)
  })

  it('Should default page count to 0 when options are not provided', async () => {
    const component = await mountSuspended(TypedDataTable, {
      props: { ...props, options: undefined },
    })

    expect(component.text()).toContain('components.pagination.page')
  })

  it('Should show a pinned column with sticky styling', async () => {
    const component = await mountSuspended(TypedDataTable, {
      props: {
        ...props,
        options: {
          ...props.options,
          initialState: {
            columnPinning: { start: ['id'], end: [] },
          },
        },
      },
    })

    const pinnedHeader = component.find('th[data-pinned="start"]')
    expect(pinnedHeader.exists()).toBeTruthy()
    expect(pinnedHeader.classes()).toContain('start-0')

    const pinnedCell = component.find('td[data-pinned="start"]')
    expect(pinnedCell.exists()).toBeTruthy()
    expect(pinnedCell.classes()).toContain('start-0')
  })

  it('Should render placeholder header cells for ungrouped columns alongside a grouped column', async () => {
    const groupedColumns = columnHelper.columns([
      columnHelper.accessor('id', {
        header: 'ID',
        cell: ({ row }) => row.getValue('id'),
      }),
      columnHelper.group({
        id: 'group',
        header: 'Info',
        columns: columnHelper.columns([
          columnHelper.accessor('name', {
            header: 'Name',
            cell: ({ row }) => row.getValue('name'),
          }),
          columnHelper.accessor('age', {
            header: 'Age',
            cell: ({ row }) => row.getValue('age'),
          }),
        ]),
      }),
    ])

    const component = await mountSuspended(TypedDataTable, {
      props: { ...props, columns: groupedColumns },
    })

    const headerRows = component.findAll('thead tr')
    expect(headerRows.length).toBe(2)
  })

  it('Should show empty state with no message when emptyMessage is not provided', async () => {
    const component = await mountSuspended(TypedDataTable, {
      props: { ...props, data: [], emptyMessage: undefined },
    })

    const empty = component.find('[test-id="empty"]')
    expect(empty.text()).toBe('')
  })

  it('Should handle custom permissions correctly', async () => {
    const permissionFn = vi
      .fn()
      .mockImplementation(item => Promise.resolve(item.id === 1))

    const component = await mountSuspended(TypedDataTable, {
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
