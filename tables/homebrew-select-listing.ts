import { createColumnHelper, type InitialTableState } from '@tanstack/vue-table'
import { iconLabelElement, homebrewTag, selectButton } from './generate-functions'

const columnHelper = createColumnHelper<HomebrewItemRow>()

export function generateColumns() {
  const { t } = useI18n()

  return [
    columnHelper.display({
      enableGlobalFilter: false,
      enableSorting: false,
      id: 'select',
      header: ({ table }) => selectButton({
        checked: table.getIsAllRowsSelected(),
        cb: table.getToggleAllPageRowsSelectedHandler(),
      }),
      cell: ({ row }) => selectButton({
        checked: row.getIsSelected(),
        cb: row.getToggleSelectedHandler(),
        disabled: !row.getCanSelect(),
      }),
    }),
    columnHelper.accessor('name', {
      header: t('general.name'),
      cell: ({ row }) => h('div', {
        class: 'flex gap-2 items-center',
      }, [
        homebrewTag(row.original.type),
        h('span', row.getValue('name')),
      ]),
    }),
    columnHelper.accessor('player', {
      header: t('general.player'),
      cell: ({ row }) => row.getValue('player'),
    }),
    columnHelper.accessor('health', {
      enableGlobalFilter: false,
      enableSorting: false,
      header: t('general.hp'),
      cell: ({ row }) => iconLabelElement({
        icon: 'tabler:heart',
        label: row.getValue('health') || '-',
        tooltip: t('general.hp'),
        color: 'text-destructive',
      }),
    }),
    columnHelper.accessor('ac', {
      enableGlobalFilter: false,
      enableSorting: false,
      header: t('general.ac'),
      cell: ({ row }) => iconLabelElement({
        icon: 'tabler:shield',
        label: row.getValue('ac') || '-',
        tooltip: t('general.ac'),
        color: 'text-help',
      }),
    }),
  ]
}

export const initialState: InitialTableState = {
  sorting: [{ id: 'name', desc: false }],
}
