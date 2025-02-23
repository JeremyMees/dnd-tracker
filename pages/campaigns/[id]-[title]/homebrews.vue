<script lang="ts" setup>
import { useQueryClient } from '@tanstack/vue-query'
import type { DataTable, LimitCta } from '#components'
import { generateColumns, expandedMarkup, initialState } from '~/tables/homebrew-listing'

const props = defineProps<{ current: CampaignFull }>()

const modal = useModal()
const { ask } = useConfirm()
const { t } = useI18n()
const queryClient = useQueryClient()
const hasRights = await allows(isCampaignAdmin, props.current)

const table = ref<InstanceType<typeof DataTable>>()
const limitCta = ref<InstanceType<typeof LimitCta>>()
const max = 100

const { data: count } = useHomebrewCount(props.current.id)
const { mutateAsync: removeHomebrew } = useHomebrewRemove()

const { data, status } = useHomebrewListing(computed(() => {
  const pagination = table.value?.vueTable.getState().pagination
  const sorting = table.value?.vueTable.getState().sorting
  const search = table.value?.vueTable.getState().globalFilter

  return {
    search,
    sortBy: sorting?.length ? sorting[0].id : initialState.sorting?.[0]?.id,
    sortDesc: sorting?.length ? sorting[0].desc : initialState.sorting?.[0]?.desc,
    page: pagination ? pagination.pageIndex : 0,
    eq: { field: 'campaign', value: props.current.id },
  }
}))

const columns = generateColumns({
  onUpdate: (item: HomebrewItemRow) => openModal(item),
  hasRights,
})

function openModal(item?: HomebrewItemRow): void {
  modal.open({
    component: 'Homebrew',
    header: t(`components.homebrewModal.${item ? 'update' : 'new'}`),
    submit: t(`components.homebrewModal.${item ? 'update' : 'add'}`),
    props: {
      campaignId: props.current.id,
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
  <div class="space-y-6">
    <div class="flex gap-4 items-center">
      <h2>{{ $t('general.homebrew', 2) }}</h2>
      <Icon
        v-tippy="{
          content: `${$t('general.monster', 2)}, ${$t('general.player', 2)}, ${$t('general.npc', 2)}, ${$t('general.summon', 2)} & ${$t('general.lair')}`,
          delay: 0,
        }"
        name="tabler:info-circle"
        aria-hidden="true"
        class="size-5 text-muted-foreground"
      />
      <div class="hidden md:flex gap-1 body-extra-small" />
    </div>

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
            :count="count"
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
