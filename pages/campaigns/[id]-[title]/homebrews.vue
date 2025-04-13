<script lang="ts" setup>
import { useQueryClient } from '@tanstack/vue-query'
import type { DataTable, LimitCta } from '#components'
import { generateColumns, expandedMarkup, initialState } from '~/tables/homebrew-listing'

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

const table = ref<InstanceType<typeof DataTable>>()
const limitCta = ref<InstanceType<typeof LimitCta>>()
const max = 100

const hasRights = computed(() => props.isOwner || props.isAdmin)
const enableDateFetching = computed(() => props.fetchReady)

const { mutateAsync: removeHomebrew } = useHomebrewRemove()
const { data: count } = useHomebrewCount(props.campaignId, enableDateFetching)

const { data, status } = useHomebrewListing(computed(() => {
  const pagination = table.value?.vueTable.getState().pagination
  const sorting = table.value?.vueTable.getState().sorting
  const search = table.value?.vueTable.getState().globalFilter

  return {
    search,
    sortBy: sorting?.length ? sorting[0].id : initialState.sorting?.[0]?.id,
    sortDesc: sorting?.length ? sorting[0].desc : initialState.sorting?.[0]?.desc,
    page: pagination ? pagination.pageIndex : 0,
    eq: { field: 'campaign', value: props.campaignId },
  }
}), enableDateFetching)

const columns = generateColumns({
  onUpdate: (item: HomebrewItemRow) => openModal(item),
  hasRights: hasRights.value,
})

function openModal(item?: HomebrewItemRow): void {
  modal.open({
    component: 'Homebrew',
    header: t(`components.homebrewModal.${item ? 'update' : 'new'}`),
    submit: t(`components.homebrewModal.${item ? 'update' : 'add'}`),
    props: {
      campaignId: props.campaignId,
      count: count.value,
      ...(item && { item }),
    },
  })
}

async function removeItems(ids: number[]): Promise<void> {
  const amount = ids.length
  const type = t('general.homebrew', amount).toLowerCase()

  ask({
    title: `${t('actions.delete')} ${amount} ${type}`,
  }, async (confirmed: boolean) => {
    if (confirmed) await removeHomebrew({ id: ids })
  })
}

function invalidateQueries(): void {
  queryClient.invalidateQueries({ queryKey: ['useHomebrewListing'] })
  queryClient.invalidateQueries({ queryKey: ['useHomebrewCount'] })
}
</script>

<template>
  <div>
    <AnimationExpand>
      <RefreshCard
        v-if="status === 'error'"
        @refresh="invalidateQueries"
      />
    </AnimationExpand>

    <LimitCta
      v-if="count && count >= max"
      ref="limitCta"
    />

    <DataTable
      ref="table"
      :columns="columns"
      :data="data?.homebrews || []"
      :total="data?.amount || 0"
      :loading="status === 'pending'"
      :options="{
        pageCount: data?.pages ?? -1,
        initialState,
      }"
      :permission="hasRights"
      :expanded-markup="expandedMarkup"
      :empty-message="$t('components.table.nothing', { item: $t('general.homebrew', 2).toLowerCase() })"
      @remove="removeItems"
      @invalidate="invalidateQueries"
    >
      <template #top>
        <div class="flex justify-end items-center gap-4">
          <ContentCount
            :loading="data?.homebrews === null"
            :count="count || 0"
            :max="max"
          />
          <button
            class="btn-primary"
            :aria-label="$t('actions.create')"
            :disabled="status === 'pending'"
            @click="() => (count || 0) >= max ? limitCta?.show() : openModal()"
          >
            {{ $t('actions.create') }}
          </button>
        </div>
      </template>

      <template #loading>
        <SkeletonHomebrewTableRow
          v-for="i in 10"
          :key="i"
        />
      </template>
    </DataTable>
  </div>
</template>
