<script setup lang="ts">
import type { DataTable, LimitCta } from '#components'

definePageMeta({ middleware: ['auth'] })
useSeo('Campaigns')

const toast = useToast()
const modal = useModal()
const campaign = useCampaigns()
const profile = useProfile()
const { ask } = useConfirm()
const { t } = useI18n()

const table = ref<InstanceType<typeof DataTable>>()
const limitCta = ref<InstanceType<typeof LimitCta>>()

const search = ref<string>('')
const sortBy = ref<string>('title')
const sortACS = ref<boolean>(true)
const page = ref<number>(0)
const count = ref<number>(await campaign.getCount())

const { data: campaigns, status, refresh } = await useAsyncData(
  'campaigns',
  async () => await campaign.get({
    search: search.value,
    sortBy: sortBy.value,
    sortACS: sortACS.value,
    page: page.value,
  }),
  {
    watch: [sortBy, sortACS, page],
  },
)

watchDebounced(
  search,
  () => refresh(),
  { debounce: 500, maxWait: 1000 },
)

const rowSelection = computed(() => selectedRows(table.value))

async function refreshData(): Promise<void> {
  refresh()
  count.value = await campaign.getCount()
}

function openModal(campaign?: CampaignItem): void {
  modal.open({
    component: 'Campaign',
    header: t(`components.campaignModal.${campaign ? 'update' : 'add'}`),
    events: { finished: () => refreshData() },
    ...(campaign && { props: { campaign } }),
  })
}

async function deleteItems(ids: number[]): Promise<void> {
  const amount = ids.length
  const type = t('general.campaign', amount).toLowerCase()

  ask({
    title: `${amount} ${type}`,
  }, async (confirmed: boolean) => {
    if (!confirmed) return

    try {
      await campaign.deleteCampaign(ids)
      refreshData()
    }
    catch (err) {
      toast.error()
    }
  })
}

async function leaveCampaign(item: CampaignItem): Promise<void> {
  const member = item.team?.find(member => member.user.id === profile.user!.id)

  if (!member) return

  ask({
    title: t('general.yourself'),
  }, async (confirmed: boolean) => {
    if (!confirmed) return

    try {
      await campaign.deleteCampaignTeamMember(member.id)

      refreshData()
    }
    catch (err) {
      toast.error()
    }
  })
}
</script>

<template>
  <NuxtLayout
    shadow
    container
  >
    <h1 class="pb-6">
      {{ $t('general.campaign', 2) }}
    </h1>
    <LimitCta
      v-if="count >= campaign.max"
      ref="limitCta"
    />
    <AnimationExpand>
      <RefreshCard
        v-if="status === 'error'"
        @refresh="refreshData()"
      />
    </AnimationExpand>
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
      :items="campaigns || []"
      :pages="campaign.pages"
      :per-page="campaign.perPage"
      :total-items="campaign.amount"
      :loading="status === 'pending'"
      type="campaign"
      select
      @remove="deleteItems"
      @paginate="page = $event"
    >
      <template #header>
        <ContentCount
          v-if="campaigns !== null && profile.data"
          :count="count"
          :max="campaign.max"
        />
        <button
          class="btn-primary"
          :aria-label="$t('actions.create')"
          :disabled="status === 'pending'"
          @click="() => {
            count >= campaign.max
              ? limitCta?.show()
              : openModal()
          }"
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
            'bg-danger/20': rowSelection[row.id],
          }"
        >
          <td class="td max-w-6">
            <FormKit
              v-if="row.created_by.id === profile.user!.id"
              v-model="rowSelection[row.id]"
              type="checkbox"
              :disabled="status === 'pending'"
              outer-class="$reset !pb-0"
              wrapper-class="$remove:mb-1"
              decorator-class="$remove:mr-2"
              @click="table?.toggleRow(row)"
            />
          </td>
          <td class="td">
            <RouteLink
              :url="campaignUrl(row, 'encounters')"
              class="underline underline-offset-2 decoration-primary"
            >
              {{ row.title }}
            </RouteLink>
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
          <td class="td flex justify-end">
            <button
              v-if="!isOwner(row, profile.user!.id)"
              v-tippy="$t('actions.leave')"
              class="icon-btn-warning"
              :aria-label="$t('actions.leave')"
              @click="leaveCampaign(row)"
            >
              <Icon
                name="tabler:door-exit"
                class="icon"
                aria-hidden="true"
              />
            </button>
            <button
              v-if="isAdmin(row, profile.user!.id)"
              v-tippy="$t('actions.update')"
              class="icon-btn-info"
              :aria-label="$t('actions.update')"
              @click="openModal(row)"
            >
              <Icon
                name="tabler:edit"
                class="icon"
                aria-hidden="true"
              />
            </button>
          </td>
        </tr>
      </template>

      <template
        v-if="!campaigns?.length && status !== 'pending'"
        #empty
      >
        {{ $t('components.table.nothing', { item: $t('general.campaign', 2).toLowerCase() }) }}
      </template>
    </DataTable>
  </NuxtLayout>
</template>
