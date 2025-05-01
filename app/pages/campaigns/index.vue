<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast/use-toast'
import type { DataTable, LimitCta } from '#components'
import { generateColumns, initialState } from '~~/tables/campaign-listing'
import { useCampaignCount, useCampaignListing, useCampaignRemove } from '~~/queries/campaigns'
import { useTeamMemberRemove } from '~~/queries/team-members'

definePageMeta({ auth: true })
useSeo('Campaigns')

const modal = useModal()
const { ask } = useConfirm()
const { toast } = useToast()
const { t } = useI18n()
const user = useAuthenticatedUser()
const queryClient = useQueryClient()

const table = ref<InstanceType<typeof DataTable>>()
const limitCta = ref<InstanceType<typeof LimitCta>>()

const { data: count } = useCampaignCount()
const { mutateAsync: removeCampaign } = useCampaignRemove()
const { mutateAsync: removeTeamMember } = useTeamMemberRemove()

const { data, status } = useCampaignListing(computed(() => {
  const pagination = table.value?.vueTable.getState().pagination
  const sorting = table.value?.vueTable.getState().sorting
  const search = table.value?.vueTable.getState().globalFilter

  return {
    search,
    sortBy: sorting?.[0]?.id ?? initialState.sorting?.[0]?.id,
    sortDesc: sorting?.[0]?.desc ?? initialState.sorting?.[0]?.desc,
    page: pagination?.pageIndex ?? 0,
  }
}))

const max = computed<number>(() => getMax('campaign', user.value.subscription_type || 'free'))

const columns = generateColumns({
  onUpdate: (item: CampaignItem) => openModal(item),
  onLeave: async (item: CampaignItem) => {
    const member = item.team?.find(member => member.user.id === user.value.id)

    if (!member) return

    ask({
      title: t('pages.campaigns.dialog.leave.title'),
      description: t('pages.campaigns.dialog.leave.text'),
    }, async (confirmed: boolean) => {
      if (!confirmed) return

      try {
        await removeTeamMember({ member: member.id, campaign: item.id })
      }
      catch (err) {
        toast({
          title: t('general.error.title'),
          description: t('general.error.text'),
          variant: 'destructive',
        })
      }
    })
  },
})

function openModal(campaign?: CampaignItem): void {
  modal.open({
    component: 'Campaign',
    header: t(`components.campaignModal.${campaign ? 'update' : 'add'}`),
    submit: t(`pages.campaigns.${campaign ? 'update' : 'add'}`),
    events: { finished: () => invalidateQueries() },
    ...(campaign && { props: { campaign } }),
  })
}

async function removeItems(ids: number[]): Promise<void> {
  const amount = ids.length
  const type = t('general.campaign', amount).toLowerCase()

  ask({
    title: `${t('actions.delete')} ${amount} ${type}`,
  }, async (confirmed: boolean) => {
    if (confirmed) {
      await removeCampaign({ id: ids })
    }
  })
}

function invalidateQueries(): void {
  queryClient.invalidateQueries({ queryKey: ['useCampaignListing'] })
  queryClient.invalidateQueries({ queryKey: ['useCampaignCount'] })
}
</script>

<template>
  <NuxtLayout
    name="sidebar"
    :header="$t('general.campaign', 2)"
  >
    <LimitCta
      v-if="count && count >= max"
      ref="limitCta"
    />

    <ClientOnly>
      <AnimationExpand>
        <RefreshCard
          v-if="status === 'error'"
          @refresh="invalidateQueries"
        />
      </AnimationExpand>
    </ClientOnly>

    <DataTable
      ref="table"
      :columns="columns"
      :data="data?.campaigns || []"
      :loading="status === 'pending'"
      :options="{
        pageCount: data?.pages ?? -1,
        initialState,
      }"
      :permission="(item: CampaignItem) => allows(isCampaignOwner, item)"
      :empty-message="$t('components.table.nothing', { item: $t('general.campaign', 2).toLowerCase() })"
      @remove="removeItems"
      @invalidate="invalidateQueries"
    >
      <template #top>
        <div class="flex justify-end items-center gap-4">
          <ContentCount
            :loading="data?.campaigns === null"
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
        <SkeletonCampaignTableRow
          v-for="i in 10"
          :key="i"
        />
      </template>
    </DataTable>
  </NuxtLayout>
</template>
