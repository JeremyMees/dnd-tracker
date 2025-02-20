import { createColumnHelper, type InitialTableState } from '@tanstack/vue-table'
import { iconButton, linkButton, selectButton, permission } from './generate-functions'

const columnHelper = createColumnHelper<EncounterItem>()

interface ColumnOptions {
  onShare: (item: EncounterItem) => void
  onCopy: (data: { data: EncounterItem }) => void
  onUpdate: (item: EncounterItem) => void
}

export function generateColumns({ onUpdate, onShare, onCopy }: ColumnOptions) {
  const { t } = useI18n()
  return [
    columnHelper.display({
      enableGlobalFilter: false,
      id: 'select',
      header: ({ table }) => selectButton(
        table.getIsAllRowsSelected(),
        table.getToggleAllPageRowsSelectedHandler(),
      ),
      cell: ({ row }) => permission(
        canUpdateEncounter,
        [row.original],
        selectButton(row.getIsSelected(), row.getToggleSelectedHandler(), !row.getCanSelect()),
      ),
    }),
    columnHelper.accessor('title', {
      header: t('general.name'),
      cell: ({ row }) => linkButton(encounterUrl(row.original), row.getValue('title')),
    }),
    columnHelper.accessor('campaign', {
      enableGlobalFilter: false,
      enableSorting: false,
      header: t('general.campaign'),
      cell: ({ row }) => row.getValue('campaign')
        ? linkButton(campaignUrl(row.original.campaign, 'encounters'), row.original.campaign.title)
        : '',
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
          iconButton('tabler:share', t('actions.share'), 'success', () => onShare(row.original)),
          permission(
            canUpdateEncounter,
            [row.original],
            [
              iconButton('tabler:copy', t('actions.copy'), 'primary', () => onCopy({ data: row.original })),
              iconButton('tabler:edit', t('actions.update'), 'info', () => onUpdate(row.original)),
            ],
          ),
        ])
      },
    }),
  ]
}

export const initialState: InitialTableState = {
  sorting: [{ id: 'created_at', desc: true }],
}
