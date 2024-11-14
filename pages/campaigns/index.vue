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
// const isOpen = ref<boolean>(false)
// const isBulk = ref<boolean>(false)
// const isUpdating = ref<boolean>(false)
// const needConfirmation = ref<boolean>(false)

const { data: campaigns, status, error, refresh, clear } = await useAsyncData(
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

const max = computed<number>(() => getMax('campaign', profile.data?.subscription_type || 'free'))

const rowSelection = computed<Record<string, boolean>>(() => {
  if (!table.value || !table.value.selected.length) return {}

  return table.value.selected.reduce((acc, row) => {
    acc[row.id] = true
    return acc
  }, {})
})

// const items = computed<CampaignRow[]>(() => {
//   return searchArray(
//     sortArray(data.value, sortedBy.value, sortACS.value),
//     'title',
//     search.value,
//   )
// })

function teamAvatars(row: CampaignItem): { username: string, img: string, role: UserRole }[] {
  return sbGetTeamMembers(row).map(({ user, role }) => ({
    username: user.username,
    img: user.avatar,
    role,
  }))
}

function resetState(): void {
  // needConfirmation.value = false
  // isBulk.value = false
  // isUpdating.value = false
  // isOpen.value = false
}

async function deleteItems(): Promise<void> {
  // ask({
  //   title: profile.data!.name,
  // }, async (confirmed: boolean) => {
  //   if (!confirmed) return

  //   try {
  //     await profile.deleteProfile()
  //     navigateTo(localePath('/'))
  //     toast.success({ text: t('pages.profile.toast.delete.text') })
  //   }
  //   catch (err) {
  //     toast.error()
  //   }
  // })
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
        { label: t('general.encounters'), sort: true, id: 'initiative_sheets' },
        { label: t('general.homebrew'), sort: true, id: 'homebrew_items' },
        { label: t('general.members'), sort: false, id: 'team' },
        { label: t('general.modify'), sort: false, id: 'modify' },
      ]"
      :items="campaigns || []"
      :pages="page"
      :loading="status === 'pending'"
      :per-page="10"
      :owner="profile.user!.id"
      index
      select
      shadow
      @remove="deleteItems"
    >
      <template #header>
        <span
          v-if="campaigns !== null && status !== 'pending' && profile.data"
          class="text-[12px] text-slate-300"
          :class="{ '!text-danger': campaigns.length >= max }"
        >
          {{ campaigns.length }}/{{ max }}
        </span>
        <button
          class="btn-primary"
          :aria-label="t('actions.create')"
          :disabled="status === 'pending' || (campaigns !== null && campaigns.length >= max)"
          @click="modal.open({
            component: 'Campaign',
            header: t('components.campaignModal.add'),
          })"
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
          <td class="td">
            modify
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
    <pre>
      only allow delete if user is owner
      {{ table?.selected }}
    </pre>
  </NuxtLayout>
</template>
