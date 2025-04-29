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
import { NuxtTime } from '#components'

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
      header: ({ table }) => selectButton({
        checked: table.getIsAllRowsSelected(),
        cb: table.getToggleAllPageRowsSelectedHandler(),
      }),
      cell: ({ row }) => hasRights
        ? selectButton({ checked: row.getIsSelected(), cb: row.getToggleSelectedHandler(), disabled: !row.getCanSelect() })
        : '',
    }),
    columnHelper.display({
      enableGlobalFilter: false,
      id: 'expand',
      header: '',
      cell: ({ row }) => expandButton({
        content: t(`actions.${row.getIsExpanded() ? 'hide' : 'show'}`),
        expanded: row.getIsExpanded(),
        cb: () => row.toggleExpanded(),
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
    columnHelper.accessor('created_at', {
      enableGlobalFilter: false,
      header: t('general.createdAt'),
      cell: ({ row }) => h(NuxtTime, {
        datetime: row.getValue<Date>('created_at'),
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      }),
    }),
    columnHelper.display({
      enableGlobalFilter: false,
      enableSorting: false,
      id: 'actions',
      cell: ({ row }) => {
        return h('div', { class: 'flex justify-end' }, [
          hasRights
            ? iconButton({ icon: 'tabler:edit', content: t('actions.update'), color: 'info', cb: () => onUpdate(row.original) })
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
        iconLabelElement({
          icon: 'tabler:heart',
          label: row.original.health?.toString() || '-',
          tooltip: t('general.hp'),
          color: 'text-destructive',
        }),
        iconLabelElement({
          icon: 'tabler:shield',
          label: row.original.ac?.toString() || '-',
          tooltip: t('general.ac'),
          color: 'text-help',
        }),
        iconLabelElement({
          icon: 'tabler:bolt',
          label: row.original.initiative_modifier ? `+${row.original.initiative_modifier}` : '-',
          tooltip: t('general.initiativeModifier'),
          color: 'text-warning',
        }),
        row.original.link
          ? iconLink({ icon: 'tabler:link', content: t('actions.link'), color: 'info', to: row.original.link, external: true })
          : '',
      ]),
    ]),
    actionsTable(row.original),
  ])
}

export const initialState: InitialTableState = {
  sorting: [{ id: 'created_at', desc: true }],
}
