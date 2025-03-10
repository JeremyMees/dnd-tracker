import { createColumnHelper, type InitialTableState, type Row } from '@tanstack/vue-table'
import { actionsTable, expandButton, iconButton } from './generate-functions'

import {
  InitiativeTableRowName,
  InitiativeTableRowHealth,
  InitiativeTableRowActions,
  InitiativeTableRowConditions,
  InitiativeTableRowNotes,
  InitiativeTableRowInit,
  InitiativeTableRowAc,
  InitiativeTableRowDeathSaves,
  InitiativeTableRowConcentration,
  InitiativeTableRowModify,
} from '#components'

const columnHelper = createColumnHelper<InitiativeSheetRow>()

interface ColumnOptions {
  sheet: ComputedRef<InitiativeSheet | undefined>
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable>) => Promise<void>
  openQuickInitModal: () => void
}

export function generateColumns({ sheet, update, openQuickInitModal }: ColumnOptions) {
  const { t } = useI18n()

  return [
    columnHelper.display({
      enableGlobalFilter: false,
      id: 'index',
      cell: ({ row }) => h('div', { class: 'flex items-center gap-x-2 max-w-20' }, [
        h('span', { class: 'text-muted-foreground ml-1' }, row.index + 1),
        expandButton({
          content: t(`actions.${row.getIsExpanded() ? 'hide' : 'show'}`),
          expanded: row.getIsExpanded(),
          cb: () => row.toggleExpanded(),
        }),
      ]),
    }),
    columnHelper.accessor('name', {
      header: t('components.encounterTable.headers.name'),
      cell: ({ row }) => h(InitiativeTableRowName, {
        item: row.original,
        sheet: sheet.value,
        update,
      }),
    }),
    columnHelper.accessor('initiative', {
      header: () => h('button', { class: 'flex items-center gap-x-2' }, [
        t('components.encounterTable.headers.init'),
        iconButton({
          icon: 'tabler:bolt-filled',
          content: t('components.encounterTable.quick'),
          color: 'warning',
          cb: () => openQuickInitModal(),
          disabled: !sheet.value?.rows.length,
          iconColor: 'text-warning',
        }),
      ]),
      cell: ({ row }) => h(InitiativeTableRowInit, {
        item: row.original,
        sheet: sheet.value,
        update,
      }),
    }),
    columnHelper.accessor('health', {
      header: t('components.encounterTable.headers.health'),
      cell: ({ row }) => h(InitiativeTableRowHealth, {
        item: row.original,
        sheet: sheet.value,
        update,
      }),
    }),
    columnHelper.accessor('ac', {
      header: t('components.encounterTable.headers.ac'),
      cell: ({ row }) => h(InitiativeTableRowAc, {
        item: row.original,
        sheet: sheet.value,
        update,
      }),
    }),
    columnHelper.display({
      id: 'manage',
      header: t('components.encounterTable.headers.manage'),
      cell: ({ row }) => h(InitiativeTableRowActions, {
        item: row.original,
        sheet: sheet.value,
        update,
      }),
    }),
    columnHelper.accessor('conditions', {
      header: t('components.encounterTable.headers.conditions'),
      cell: ({ row }) => h(InitiativeTableRowConditions, {
        item: row.original,
        sheet: sheet.value,
        update,
      }),
    }),
    columnHelper.accessor('note', {
      header: t('components.encounterTable.headers.note'),
      cell: ({ row }) => h(InitiativeTableRowNotes, {
        item: row.original,
        sheet: sheet.value,
        update,
      }),
    }),
    columnHelper.accessor('deathSaves', {
      header: t('components.encounterTable.headers.deathSaves'),
      cell: ({ row }) => h(InitiativeTableRowDeathSaves, {
        item: row.original,
        sheet: sheet.value,
        update,
      }),
    }),
    columnHelper.accessor('concentration', {
      header: t('components.encounterTable.headers.concentration'),
      cell: ({ row }) => h(InitiativeTableRowConcentration, {
        item: row.original,
        sheet: sheet.value,
        update,
      }),
    }),
    columnHelper.display({
      enableGlobalFilter: false,
      enableSorting: false,
      id: 'actions',
      cell: ({ row }) => h(InitiativeTableRowModify, {
        item: row.original,
        sheet: sheet.value,
        update,
      }),
    }),
  ]
}

export function expandedMarkup(row: Row<InitiativeSheetRow>) {
  return actionsTable(row.original)
}

export const initialState: InitialTableState = {}
