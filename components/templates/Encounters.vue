<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast/use-toast'
import type { DataTable, LimitCta } from '#components'
import { generateColumns, initialState } from '~/tables/encounter-listing'

const props = defineProps<{ campaign?: CampaignFull }>()

const { toast } = useToast()
const modal = useModal()
const clipboard = useClipboard()
const { ask } = useConfirm()
const { t, locale } = useI18n()
const user = useAuthenticatedUser()
const queryClient = useQueryClient()

const table = ref<InstanceType<typeof DataTable>>()
const limitCta = ref<InstanceType<typeof LimitCta>>()

const { data: count } = useEncounterCount()
const { mutateAsync: removeEncounter } = useEncounterRemove()
const { mutateAsync: copyEncounter } = useEncounterCopy()

const { data, status } = useEncounterListing(computed(() => {
  const pagination = table.value?.vueTable.getState().pagination
  const sorting = table.value?.vueTable.getState().sorting
  const search = table.value?.vueTable.getState().globalFilter

  return {
    search,
    sortBy: sorting?.length ? sorting[0].id : initialState.sorting?.[0]?.id,
    sortDesc: sorting?.length ? sorting[0].desc : initialState.sorting?.[0]?.desc,
    page: pagination ? pagination.pageIndex : 0,
    eq: props.campaign?.id ? { field: 'campaign', value: props.campaign.id } : undefined,
  }
}))

const max = computed<number>(() => getMax('encounter', user.value.subscription_type))

const columns = generateColumns({
  onShare: async (item: EncounterItem) => await shareEncounter(item),
  onUpdate: (item: EncounterItem) => openModal(item),
  onCopy: async ({ data }: { data: EncounterItem }) => await copyEncounter({ data }),
})

async function shareEncounter(item: EncounterItem): Promise<void> {
  try {
    const jwt = await $fetch<string>('/api/encounter/share', {
      method: 'POST',
      body: { encounter: item.id },
    })

    if (!jwt) throw createError('Failed to share encounter')

    const url = shareEncounterUrl(jwt, locale.value)

    clipboard.copy(url)

    toast({
      description: `${item.title} ${t('actions.copyClipboard').toLowerCase()}`,
      variant: 'info',
    })
  }
  catch {
    toast({
      title: t('general.error.title'),
      description: t('general.error.text'),
      variant: 'destructive',
    })
  }
}
function openModal(item?: EncounterItem): void {
  modal.open({
    component: 'Encounter',
    header: t(`components.encounterModal.${item ? 'update' : 'add'}`),
    submit: t(`pages.encounters.${item ? 'update' : 'add'}`),
    props: {
      ...(item && { encounter: item }),
      campaignId: props.campaign?.id,
    },
  })
}

async function removeItems(ids: number[]): Promise<void> {
  const amount = ids.length
  const type = t('general.encounter', amount).toLowerCase()

  ask({
    title: `${t('actions.delete')} ${amount} ${type}`,
  }, async (confirmed: boolean) => {
    if (confirmed) await removeEncounter({ id: ids })
  })
}

function invalidateQueries(): void {
  queryClient.invalidateQueries({ queryKey: ['useEncounterListing'] })
  queryClient.invalidateQueries({ queryKey: ['useEncounterCount'] })
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
      :data="data?.encounters || []"
      :total="data?.amount || 0"
      :loading="status === 'pending'"
      :options="{
        pageCount: data?.pages ?? -1,
        initialState,
      }"
      :permission="(item: EncounterItem) => allows(canUpdateEncounter, item)"
      :empty-message="$t('components.table.nothing', { item: $t('general.encounter', 2).toLowerCase() })"
      @remove="removeItems"
      @invalidate="invalidateQueries"
    >
      <template #top>
        <div class="flex justify-end items-center gap-4">
          <ContentCount
            :loading="data?.encounters === null"
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
        <SkeletonEncounterTableRow
          v-for="i in 10"
          :key="i"
        />
      </template>
    </DataTable>
  </div>
</template>
