<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast/use-toast'
import type { DataTable, LimitCta } from '#components'

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

const search = ref<string>('')
const sortBy = ref<string>('title')
const sortACS = ref<boolean>(true)
const page = ref<number>(0)

const { data: count } = useCampaignCount()
const { mutateAsync: removeCampaign } = useCampaignRemove()
const { mutateAsync: removeTeamMember } = useTeamMemberRemove()

const { data, isPending: campaignsPending, isError: campaignsError } = useCampaignListing(
  computed(() => ({
    search: search.value,
    sortBy: sortBy.value,
    sortACS: sortACS.value,
    page: page.value,
  })),
)

const rowSelection = computed(() => selectedRows(table.value))

const max = computed<number>(() => getMax('campaign', user.value.subscription_type || 'free'))

function openModal(campaign?: CampaignItem): void {
  modal.open({
    component: 'Campaign',
    header: t(`components.campaignModal.${campaign ? 'update' : 'add'}`),
    submit: t(`pages.campaigns.${campaign ? 'update' : 'add'}`),
    events: { finished: () => queryClient.invalidateQueries({ queryKey: ['useCampaignListing'] }) },
    ...(campaign && { props: { campaign } }),
  })
}

async function deleteItems(ids: number[]): Promise<void> {
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

async function leaveCampaign(item: CampaignItem): Promise<void> {
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
}
</script>

<template>
  <NuxtLayout
    name="sidebar"
    :header="$t('general.campaign', 2)"
  >
    <LimitCta
      v-if="count >= max"
      ref="limitCta"
    />
    <ClientOnly>
      <AnimationExpand>
        <RefreshCard
          v-if="campaignsError"
          @refresh="queryClient.invalidateQueries({ queryKey: ['useCampaignListing'] })"
        />
      </AnimationExpand>
    </ClientOnly>
    <DataTable
      ref="table"
      v-model:sort-by="sortBy"
      v-model:acs="sortACS"
      v-model:search="search"
      :headers="[
        { label: $t('general.name'), sort: true, id: 'title' },
        { label: $t('general.encounter', 2), sort: false, id: 'initiative_sheets' },
        { label: $t('general.homebrew', 2), sort: false, id: 'homebrew_items' },
        { label: $t('general.member', 2), sort: false, id: 'team' },
        { label: '', sort: false, id: 'modify' },
      ]"
      :items="data?.campaigns || []"
      :pages="data?.pages || 0"
      :per-page="10"
      :total-items="data?.amount || 0"
      :loading="campaignsPending"
      type="campaign"
      select
      @remove="deleteItems"
      @paginate="page = $event"
    >
      <template #header>
        <ContentCount
          v-if="data?.campaigns !== null && count"
          :count="count"
          :max="max"
        />
        <button
          class="btn-primary"
          :aria-label="$t('actions.create')"
          :disabled="campaignsPending"
          @click="() => (count || 0) >= max ? limitCta?.show() : openModal()"
        >
          {{ $t('actions.create') }}
        </button>
      </template>

      <template #default="{ rows }: { rows: CampaignItem[] }">
        <tr
          v-for="row in rows"
          :key="row.id"
          class="tr transition-colors"
          :class="{
            'bg-destructive/20': rowSelection[row.id],
          }"
        >
          <td class="td max-w-6">
            <FormKit
              v-if="row.created_by.id === user.id"
              v-model="rowSelection[row.id]"
              type="checkbox"
              :disabled="campaignsPending"
              outer-class="$reset !pb-0"
              wrapper-class="$remove:mb-1"
              decorator-class="$remove:mr-2"
              @click="table?.toggleRow(row)"
            />
          </td>
          <td class="td">
            <NuxtLinkLocale
              :to="campaignUrl(row, 'encounters')"
              class="underline underline-offset-2 decoration-primary"
            >
              {{ row.title }}
            </NuxtLinkLocale>
          </td>
          <td class="td">
            {{ row.initiative_sheets }}
          </td>
          <td class="td">
            {{ row.homebrew_items }}
          </td>
          <td class="td">
            <AvatarGroup
              :owner="row.created_by"
              :team="row.team || []"
            />
          </td>
          <td class="td">
            <div class="flex justify-end">
              <button
                v-if="!isOwner(row, user.id)"
                v-tippy="$t('actions.leave')"
                class="icon-btn-warning"
                :aria-label="$t('actions.leave')"
                @click="leaveCampaign(row)"
              >
                <Icon
                  name="tabler:door-exit"
                  class="size-5"
                  aria-hidden="true"
                />
              </button>
              <button
                v-if="isAdmin(row, user.id)"
                v-tippy="$t('actions.update')"
                class="icon-btn-info"
                :aria-label="$t('actions.update')"
                @click="openModal(row)"
              >
                <Icon
                  name="tabler:edit"
                  class="size-5"
                  aria-hidden="true"
                />
              </button>
            </div>
          </td>
        </tr>
      </template>

      <template
        v-if="!data?.campaigns?.length && !campaignsPending"
        #empty
      >
        {{ $t('components.table.nothing', { item: $t('general.campaign', 2).toLowerCase() }) }}
      </template>
    </DataTable>
  </NuxtLayout>
</template>
