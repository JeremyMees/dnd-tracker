import { createColumnHelper, type TableState } from '@tanstack/vue-table'
import type { HomebrewSelectFeatures } from './features'
import {
  iconLabelElement,
  homebrewTag,
  selectButton,
} from './generate-functions'

const columnHelper = createColumnHelper<
  HomebrewSelectFeatures,
  HomebrewItemRow
>()

export function generateColumns() {
  const { t } = useI18n()

  return columnHelper.columns([
    columnHelper.display({
      enableGlobalFilter: false,
      enableSorting: false,
      id: 'select',
      header: ({ table }) =>
        selectButton({
          checked: table.getIsAllRowsSelected(),
          cb: table.getToggleAllPageRowsSelectedHandler(),
        }),
      cell: ({ row }) =>
        selectButton({
          checked: row.getIsSelected(),
          cb: row.getToggleSelectedHandler(),
          disabled: !row.getCanSelect(),
        }),
    }),
    columnHelper.accessor('name', {
      header: t('general.name'),
      cell: ({ row }) =>
        h(
          'div',
          {
            class: 'flex gap-2 items-center',
          },
          [homebrewTag(row.original.type), h('span', row.getValue('name'))],
        ),
    }),
    columnHelper.accessor('player', {
      header: t('general.player'),
      cell: ({ row }) => row.getValue('player'),
    }),
    columnHelper.accessor('hitPoints', {
      enableGlobalFilter: false,
      enableSorting: false,
      header: t('general.hp'),
      cell: ({ row }) =>
        iconLabelElement({
          icon: 'tabler:heart',
          label: row.getValue('hitPoints') || '-',
          tooltip: t('general.hp'),
          color: 'text-destructive',
        }),
    }),
    columnHelper.accessor('armorClass', {
      enableGlobalFilter: false,
      enableSorting: false,
      header: t('general.ac'),
      cell: ({ row }) =>
        iconLabelElement({
          icon: 'tabler:shield',
          label: row.getValue('armorClass') || '-',
          tooltip: t('general.ac'),
          color: 'text-help',
        }),
    }),
  ])
}

export const initialState: Partial<TableState<HomebrewSelectFeatures>> = {
  sorting: [{ id: 'name', desc: false }],
}
