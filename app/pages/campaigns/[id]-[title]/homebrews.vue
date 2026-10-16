<script lang="ts" setup>
import { useQueryClient } from '@tanstack/vue-query'
import type { DataTable, LimitCta } from '#components'
import {
  generateColumns,
  expandedMarkup,
  initialState,
} from '~/tables/homebrew-listing'
import {
  useHomebrewCount,
  useHomebrewListing,
  useHomebrewRemove,
  useHomebrewImport,
} from '~/queries/homebrews'
import { maxCampaignHomebrews } from '~~/constants/validation'

useSeo('Campaign homebrews')

const props = defineProps<{
  current?: CampaignFull
  campaignId: number
  isAdmin: boolean
  isOwner: boolean
  fetchReady: boolean
}>()

const modal = useModal()
const { ask } = useConfirm()
const { t } = useI18n()
const queryClient = useQueryClient()

const table = ref<DataTableExposed>()
const limitCta = ref<InstanceType<typeof LimitCta>>()
const pageSize = 20

const hasRights = computed(() => props.isOwner || props.isAdmin)
const enableDateFetching = computed(() => props.fetchReady)

const { mutateAsync: removeHomebrew } = useHomebrewRemove()
const { mutateAsync: importHomebrews, isPending: importing } =
  useHomebrewImport()
const transfer = useTransferFile()
const { data: count } = useHomebrewCount(props.campaignId, enableDateFetching)

const { data, status } = useHomebrewListing(
  computed(() => {
    const pagination = table.value?.vueTable.atoms.pagination.get()
    const sorting = table.value?.vueTable.atoms.sorting.get()
    const search = table.value?.vueTable.atoms.globalFilter.get()

    return {
      search,
      sortBy: sorting?.[0]?.id ?? initialState.sorting?.[0]?.id,
      sortDesc: sorting?.[0]?.desc ?? initialState.sorting?.[0]?.desc,
      page: pagination?.pageIndex ?? 0,
      eq: { field: 'campaign', value: props.campaignId },
    }
  }),
  enableDateFetching,
  pageSize,
)

const columns = generateColumns({
  onUpdate: (item: HomebrewItemRow) => openModal(item),
  hasRights: hasRights.value,
})

function openModal(item?: HomebrewItemRow): void {
  modal.open({
    component: 'Homebrew',
    header: t(`components.homebrewModal.${item ? 'update' : 'new'}`),
    variant: 'fullScreen',
    props: {
      campaignId: props.campaignId,
      ...(item && { item }),
    },
  })
}

async function removeItems(ids: number[]): Promise<void> {
  const amount = ids.length
  const type = t('general.homebrew', amount).toLowerCase()

  ask(
    {
      title: `${t('actions.delete')} ${amount} ${type}`,
    },
    async (confirmed: boolean) => {
      if (confirmed) await removeHomebrew({ id: ids })
    },
  )
}

function exportItems(items: HomebrewItemRow[]): void {
  transfer.download('homebrews', items.map(toHomebrewTransfer))
}

async function importItems(file: File): Promise<void> {
  const items = await transfer.read(
    file,
    'homebrews',
    maxCampaignHomebrews - (count.value ?? 0),
  )

  if (!items) return

  await importHomebrews({
    data: items.map(item => ({ ...item, campaign: props.campaignId })),
  })
}

function invalidateQueries(): void {
  queryClient.invalidateQueries({ queryKey: queryKeys.homebrewListing() })
  queryClient.invalidateQueries({ queryKey: queryKeys.homebrewCount() })
}
</script>

<template>
  <div>
    <AnimationExpand>
      <RefreshCard v-if="status === 'error'" @refresh="invalidateQueries" />
    </AnimationExpand>

    <LimitCta v-if="count && count >= maxCampaignHomebrews" ref="limitCta" />

    <DataTable
      ref="table"
      :columns="columns"
      :data="data?.homebrews || []"
      :total="data?.amount || 0"
      :page-size="pageSize"
      :loading="status === 'pending'"
      :options="{
        pageCount: data?.pages ?? -1,
        initialState,
      }"
      :permission="hasRights"
      :expanded-markup="expandedMarkup"
      :empty-message="
        $t('components.table.nothing', {
          item: $t('general.homebrew', 2).toLowerCase(),
        })
      "
      exportable
      @remove="removeItems"
      @export="exportItems"
      @invalidate="invalidateQueries"
    >
      <template #top>
        <div class="flex flex-wrap justify-end items-center gap-2 sm:gap-4">
          <ContentCount
            :loading="data?.homebrews === null"
            :count="count || 0"
            :max="maxCampaignHomebrews"
          />
          <ImportButton
            v-if="hasRights"
            accept="application/json,.json,text/csv,.csv,text/markdown,.md,.markdown,text/plain,.txt"
            :disabled="status === 'pending' || importing"
            :loading="data?.homebrews === null"
            @import="importItems"
          />
          <CreateButton
            v-if="hasRights"
            :allow-create="
              isDefined(count) ? count < maxCampaignHomebrews : false
            "
            :disabled="status === 'pending'"
            :loading="data?.homebrews === null"
            @create="openModal()"
            @hit-limit="limitCta?.show()"
          />
        </div>
      </template>

      <template #loading>
        <SkeletonHomebrewTableRow v-for="i in 10" :key="i" />
      </template>
    </DataTable>
  </div>
</template>
