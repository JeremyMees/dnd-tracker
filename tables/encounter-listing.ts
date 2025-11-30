import { createColumnHelper, type InitialTableState } from '@tanstack/vue-table'
import { iconButton, linkButton, selectButton, permission } from './generate-functions'
import { NuxtTime } from '#components'

const columnHelper = createColumnHelper<EncounterItem>()

interface ColumnOptions {
  isCampaign: boolean
  onShare: (item: EncounterItem) => void
  onCopy: (data: { data: EncounterItem }) => void
  onUpdate: (item: EncounterItem) => void
}

function isCampaignOwner(user: AuthUser, encounter: EncounterItem) {
  return user.id === encounter.campaign?.created_by.id
}

export function generateColumns({ isCampaign, onUpdate, onShare, onCopy }: ColumnOptions) {
  const { t } = useI18n()
  const user = useAuthenticatedUser()

  return [
    columnHelper.display({
      enableGlobalFilter: false,
      id: 'select',
      header: ({ table }) => selectButton({
        checked: table.getIsAllRowsSelected(),
        cb: table.getToggleAllPageRowsSelectedHandler(),
      }),
      cell: ({ row }) => permission({
        ability: canUpdateEncounter,
        args: [row.original, isCampaign],
        children: selectButton({
          checked: row.getIsSelected(),
          cb: row.getToggleSelectedHandler(),
          disabled: !row.getCanSelect(),
        }),
      }),
    }),
    columnHelper.accessor('title', {
      header: t('general.name'),
      cell: ({ row }) => linkButton({
        to: encounterUrl(row.original),
        content: row.getValue('title'),
      }),
    }),
    columnHelper.accessor('campaign', {
      enableGlobalFilter: false,
      enableSorting: false,
      header: t('general.campaign'),
      cell: ({ row }) => row.getValue('campaign')
        ? linkButton({ to: campaignUrl(row.original.campaign, 'encounters'), content: row.original.campaign.title })
        : '',
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
      header: t('general.role'),
      cell: ({ row }) => {
        const hasTeam = !!row.original.campaign?.team?.length

        const owner = isCampaign
          ? isCampaignOwner(user.value, row.original)
          : isOwner(row.original, user.value.id)

        const admin = hasTeam
          ? isAdmin(row.original.campaign.team, user.value.id)
          : false

        const member = hasTeam
          ? isMember(row.original.campaign.team, user.value.id)
          : false

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
      cell: ({ row }) => {
        return h('div', { class: 'flex justify-end' }, [
          iconButton({
            icon: 'tabler:share',
            content: t('actions.share'),
            variant: 'success-ghost',
            cb: () => onShare(row.original),
          }),
          permission({
            ability: canUpdateEncounter,
            args: [row.original, isCampaign],
            children: [
              iconButton({
                icon: 'tabler:copy',
                content: t('actions.copy'),
                variant: 'default-ghost',
                cb: () => onCopy({ data: row.original }),
              }),
              iconButton({
                icon: 'tabler:edit',
                content: t('actions.update'),
                variant: 'info-ghost',
                cb: () => onUpdate(row.original),
              }),
            ],
          }),
        ])
      },
    }),
  ]
}

export const initialState: InitialTableState = {
  sorting: [{ id: 'created_at', desc: true }],
}
