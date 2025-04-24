import { createColumnHelper, type InitialTableState, type Row } from '@tanstack/vue-table'

import {
  expandButton,
  iconButton,
  selectButton,
} from './generate-functions'

const columnHelper = createColumnHelper<NoteRow>()

interface ColumnOptions {
  onUpdate: (item: NoteRow) => void
  onSendMail: (item: NoteRow) => void
  hasRights: boolean
  isInCoolDown: (id: number) => boolean
  getRemainingTime: (id: number) => number
}

export function generateColumns({ onUpdate, onSendMail, hasRights, isInCoolDown, getRemainingTime }: ColumnOptions) {
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
        ? selectButton({
            checked: row.getIsSelected(),
            cb: row.getToggleSelectedHandler(),
            disabled: !row.getCanSelect(),
          })
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
    columnHelper.accessor('title', {
      header: t('general.title'),
      cell: ({ row }) => row.getValue('title'),
    }),
    columnHelper.accessor('created_at', {
      header: t('general.createdAt'),
      cell: ({ row }) => formatDate(row.getValue('created_at')),
    }),
    columnHelper.display({
      enableGlobalFilter: false,
      enableSorting: false,
      id: 'actions',
      cell: ({ row }) => {
        return h('div', { class: 'flex justify-end' }, [
          isInCoolDown(row.original.id) && h('div', {
            class: 'mt-auto text-muted-foreground text-sm w-7',
          }, [
            `${getRemainingTime(row.original.id)}s`,
          ]),
          iconButton({
            icon: 'tabler:send',
            content: t('actions.sendMail'),
            color: 'info',
            cb: () => onSendMail(row.original),
            disabled: isInCoolDown(row.original.id),
          }),
          hasRights
            ? iconButton({
                icon: 'tabler:edit',
                content: t('actions.update'),
                color: 'info',
                cb: () => onUpdate(row.original),
              })
            : '',
        ])
      },
    }),
  ]
}

export function expandedMarkup(row: Row<NoteRow>) {
  return h('div', {
    class: 'html-richtext max-h-[350px] sm:max-h-[600px] overflow-y-auto',
    innerHTML: row.original.text,
  })
}

export const initialState: InitialTableState = {
  sorting: [{ id: 'created_at', desc: true }],
}
