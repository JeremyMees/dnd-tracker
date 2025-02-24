import { createColumnHelper, type InitialTableState } from '@tanstack/vue-table'
import { iconButton, linkButton, selectButton, permission } from './generate-functions'

const columnHelper = createColumnHelper<CampaignItem>()

interface ColumnOptions {
  onLeave: (item: CampaignItem) => Promise<void>
  onUpdate: (item: CampaignItem) => void
}

export function generateColumns({ onUpdate, onLeave }: ColumnOptions) {
  const { t } = useI18n()
  const user = useAuthenticatedUser()
  return [
    columnHelper.display({
      enableGlobalFilter: false,
      id: 'select',
      header: ({ table }) => selectButton(
        table.getIsAllRowsSelected(),
        table.getToggleAllPageRowsSelectedHandler(),
      ),
      cell: ({ row }) => permission(
        isCampaignOwner,
        [row.original],
        selectButton(row.getIsSelected(), row.getToggleSelectedHandler(), !row.getCanSelect()),
      ),
    }),
    columnHelper.accessor('title', {
      header: t('general.name'),
      cell: ({ row }) => linkButton(campaignUrl(row.original, 'encounters'), row.getValue('title')),
    }),
    columnHelper.accessor('initiative_sheets', {
      enableGlobalFilter: false,
      enableSorting: false,
      header: t('general.encounter', 2),
      cell: ({ row }) => row.getValue('initiative_sheets'),
    }),
    columnHelper.accessor('homebrew_items', {
      enableGlobalFilter: false,
      enableSorting: false,
      header: t('general.homebrew', 2),
      cell: ({ row }) => row.getValue('homebrew_items'),
    }),
    columnHelper.accessor('team', {
      enableGlobalFilter: false,
      enableSorting: false,
      header: t('general.member', 2),
      cell: ({ row }) => row.original.team.length + 1,
    }),
    columnHelper.accessor('created_at', {
      enableGlobalFilter: false,
      header: t('general.createdAt'),
      cell: ({ row }) => formatDate(row.getValue('created_at')),
    }),
    columnHelper.display({
      enableGlobalFilter: false,
      enableSorting: false,
      header: t('general.role'),
      cell: ({ row }) => {
        const admin = isAdmin(row.original.team, user.value.id)
        const owner = isOwner(row.original, user.value.id)
        const member = isMember(row.original.team, user.value.id)

        if (admin) return t('general.admin')
        if (member) return t('general.member')
        if (owner) return t('general.owner')
        return t('general.viewer')
      },
    }),
    columnHelper.display({
      enableGlobalFilter: false,
      enableSorting: false,
      id: 'actions',
      cell: ({ row }) => permission(
        isCampaignAdmin,
        [row.original],
        [
          iconButton('tabler:door-exit', t('actions.leave'), 'warning', () => onLeave(row.original)),
          iconButton('tabler:edit', t('actions.update'), 'info', () => onUpdate(row.original)),
        ],
        'flex justify-end',
        'div',
      ),
    }),
  ]
}

export const initialState: InitialTableState = {
  sorting: [{ id: 'created_at', desc: true }],
}
