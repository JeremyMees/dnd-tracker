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
const sortACS = ref<boolean>(false)
const page = ref<number>(0)

const { data: campaigns, status, refresh } = await useAsyncData(
  'campaigns',
  async () => await campaign.fetch({
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
    <h1 class="pb-6">
      {{ t('general.campaigns') }}
    </h1>
    <LimitCta
      v-if="campaign.amount >= campaign.max"
      ref="limitCta"
    />
    <AnimationExpand>
      <Card
        v-if="status === 'error'"
        color="danger"
        class="w-full max-w-prose mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <h2 class="text-center">
          {{ t('general.error.text') }}
        </h2>
        <button
          class="btn-black"
          :aria-label="t('actions.tryAgain')"
          @click="refresh()"
        >
          {{ t('actions.tryAgain') }}
        </button>
      </Card>
    </AnimationExpand>
    <DataTable
      ref="table"
      v-model:sort-by="sortBy"
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
      type="campaign"
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
          :disabled="status === 'pending'"
          @click="() => {
            campaign.amount >= campaign.max
              ? limitCta?.show()
              : openModal()
          }"
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
            <RouteLink
              :url="campaignUrl(row, 'content')"
              class="underline underline-offset-2 decoration-primary"
            >
              {{ row.title }}
            </RouteLink>
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
              v-if="isOwner(row, profile.user!.id)"
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
        {{
          t('components.table.nothing', {
            item: t(`general.campaign${(table?.selected || []).length > 1 ? 's' : ''}`).toLowerCase(),
          })
        }}
      </template>
    </DataTable>
  </NuxtLayout>
</template>
