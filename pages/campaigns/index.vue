<script setup lang="ts">
import type { DataTable } from '#components'

definePageMeta({ middleware: ['auth'] })
useSeo('Campaigns')

const toast = useToast()
const modal = useModal()
const campaign = useCampaigns()
const profile = useProfile()
const { ask } = useConfirm()
const { t } = useI18n()

const table = ref<InstanceType<typeof DataTable>>()
const search = ref<string>('')
const sortedBy = ref<string>('title')
const sortACS = ref<boolean>(false)
const page = ref<number>(0)

const { data: campaigns, status, refresh } = await useAsyncData(
  'campaigns',
  async () => await campaign.fetch({
    search: search.value,
    sortedBy: sortedBy.value,
    sortACS: sortACS.value,
    page: page.value,
  }),
  {
    watch: [search, sortedBy, sortACS, page],
  },
)

const rowSelection = computed<Record<string, boolean>>(() => {
  if (!table.value || !table.value.selected.length) return {}

  return table.value.selected.reduce((acc, row) => {
    acc[row.id] = true
    return acc
  }, {})
})

function teamAvatars(row: CampaignItem): { username: string, img: string, role: UserRole }[] {
  return sbGetTeamMembers(row).map(({ user, role }) => ({
    username: user.username,
    img: user.avatar,
    role,
  }))
}

function openModal(campaign?: CampaignItem): void {
  modal.open({
    component: 'Campaign',
    header: t(`components.campaignModal.${campaign ? 'update' : 'add'}`),
    events: { finished: () => refresh() },
    ...(campaign && { props: { campaign } }),
  })
}

async function deleteItems(ids: number[]): Promise<void> {
  const amount = ids.length
  const type = t(`general.${amount > 1 ? 'campaigns' : 'campaign'}`).toLowerCase()

  ask({
    title: `${amount} ${type}`,
  }, async (confirmed: boolean) => {
    if (!confirmed) return

    try {
      await campaign.deleteCampaign(ids)
      refresh()
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
    <DataTable
      ref="table"
      v-model:sorted-by="sortedBy"
      v-model:acs="sortACS"
      v-model:search="search"
      :headers="[
        { label: t('general.name'), sort: true, id: 'title' },
        { label: t('general.encounters'), sort: false, id: 'initiative_sheets' },
        { label: t('general.homebrew'), sort: false, id: 'homebrew_items' },
        { label: t('general.members'), sort: false, id: 'team' },
        { label: '', sort: false, id: 'modify' },
      ]"
      :items="campaigns || []"
      :pages="campaign.pages"
      :per-page="campaign.perPage"
      :total-items="campaign.amount"
      :loading="status === 'pending'"
      :owner="profile.user!.id"
      type="campaigns"
      select
      @remove="deleteItems"
      @paginate="page = $event"
    >
      <template #header>
        <span
          v-if="campaigns !== null && profile.data"
          class="text-[12px] text-slate-300"
          :class="{ '!text-danger': campaign.amount >= campaign.max }"
        >
          {{ campaign.amount }}/{{ campaign.max }}
        </span>
        <button
          class="btn-primary"
          :aria-label="t('actions.create')"
          :disabled="status === 'pending' || (campaigns !== null && campaign.amount >= campaign.max)"
          @click="openModal()"
        >
          {{ t('actions.create') }}
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
              wrapper-class="$remove:mb-0"
              decorator-class="$remove:mr-2"
              @click="table?.toggleRow(row)"
            />
          </td>
          <td class="td">
            {{ row.title }}
          </td>
          <td class="td">
            {{ row.homebrew_items }}
          </td>
          <td class="td">
            {{ row.initiative_sheets }}
          </td>
          <td class="td">
            <AvatarGroup :avatars="teamAvatars(row)" />
          </td>
          <td class="td flex justify-end">
            <button
              v-if="isAdmin(row, profile.user!.id)"
              v-tippy="t('actions.update')"
              class="icon-btn-info group"
              :aria-label="t('actions.update')"
              @click="openModal(row)"
            >
              <Icon
                name="material-symbols:settings-outline"
                class="icon-info"
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
        {{ t('components.table.nothing', { item: t('general.campaigns').toLowerCase() }) }}
      </template>
    </DataTable>
  </NuxtLayout>
</template>
