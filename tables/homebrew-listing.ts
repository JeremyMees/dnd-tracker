import { createColumnHelper, type InitialTableState, type Row } from '@tanstack/vue-table'

import {
  actionsTable,
  expandButton,
  iconButton,
  iconLabelElement,
  homebrewTag,
  iconLink,
  selectButton,
} from './generate-functions'

const columnHelper = createColumnHelper<HomebrewItemRow>()

interface ColumnOptions {
  onUpdate: (item: HomebrewItemRow) => void
  hasRights: boolean
}

export function generateColumns({ onUpdate, hasRights }: ColumnOptions) {
  const { t } = useI18n()

  return [
    columnHelper.display({
      enableGlobalFilter: false,
      id: 'select',
      header: ({ table }) => selectButton(
        table.getIsAllRowsSelected(),
        table.getToggleAllPageRowsSelectedHandler(),
      ),
      cell: ({ row }) => hasRights
        ? selectButton(row.getIsSelected(), row.getToggleSelectedHandler(), !row.getCanSelect())
        : '',
    }),
    columnHelper.display({
      enableGlobalFilter: false,
      id: 'expand',
      header: '',
      cell: ({ row }) => expandButton(
        t(`actions.${row.getIsExpanded() ? 'hide' : 'show'}`),
        row.getIsExpanded(),
        () => row.toggleExpanded(),
      ),
    }),
    columnHelper.accessor('name', {
      header: t('general.name'),
      cell: ({ row }) => h('div', {
        class: 'flex gap-2',
      }, [
        homebrewTag(row.original.type),
        h('span', row.getValue('name')),
      ]),
    }),
    columnHelper.accessor('player', {
      header: t('general.player'),
      cell: ({ row }) => row.getValue('player'),
    }),
    columnHelper.accessor('created_at', {
      enableGlobalFilter: false,
      header: t('general.createdAt'),
      cell: ({ row }) => formatDate(row.getValue('created_at')),
    }),
    columnHelper.display({
      enableGlobalFilter: false,
      enableSorting: false,
      id: 'actions',
      cell: ({ row }) => {
        return h('div', { class: 'flex justify-end' }, [
          hasRights
            ? iconButton('tabler:edit', t('actions.update'), 'info', () => onUpdate(row.original))
            : '',
        ])
      },
    }),
  ]
}

export function expandedMarkup(row: Row<HomebrewItemRow>) {
  const { t } = useI18n()

  return h('div', {
    class: 'flex flex-col gap-4',
  }, [
    h('div', { class: 'flex gap-4' }, [
      h('div', { class: 'flex gap-x-4 gap-y-2' }, [
        iconLabelElement(
          'tabler:heart',
          row.original.health?.toString() || '-',
          t('general.hp'),
          'text-destructive',
        ),
        iconLabelElement(
          'tabler:shield',
          row.original.ac?.toString() || '-',
          t('general.ac'),
          'text-help',
        ),
        iconLabelElement(
          'tabler:bolt',
          row.original.initiative_modifier ? `+${row.original.initiative_modifier}` : '-',
          t('general.initiativeModifier'),
          'text-warning',
        ),
        row.original.link
          ? iconLink('tabler:link', t('actions.link'), 'info', row.original.link, true)
          : '',
      ]),
    ]),
    actionsTable(row.original),
  ])
}

export const initialState: InitialTableState = {
  sorting: [{ id: 'created_at', desc: true }],
}
