<script setup lang="ts">
import type { DataTable, LimitCta } from '#components'

const props = withDefaults(
  defineProps<{
    campaignView?: boolean
  }>(), {
    campaignView: false,
  },
)
const table = ref<InstanceType<typeof DataTable>>()
const limitCta = ref<InstanceType<typeof LimitCta>>()

const toast = useToast()
const modal = useModal()
const encounter = useEncounters()
const profile = useProfile()
const clipboard = useClipboard()
const { ask } = useConfirm()
const { t, locale } = useI18n()

const search = ref<string>('')
const sortBy = ref<string>('title')
const sortACS = ref<boolean>(false)
const page = ref<number>(0)
const count = ref<number>(await encounter.fetchCount())

const { data: encounters, status, refresh } = await useAsyncData(
  'encounters',
  async () => await encounter.fetch({
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
  count.value = await encounter.fetchCount()
}

async function copy(item: EncounterItem): Promise<void> {
  try {
    await encounter.copyEncounter(item)
    refreshData()
  }
  catch (err) {
    toast.error()
  }
}

function share(item: EncounterItem): void {
  clipboard.copy(shareEncounterUrl(item, locale.value))

  toast.info({
    title: `${item.title} ${t('actions.copyClipboard').toLowerCase()}`,
    timeout: 2000,
  })
}

function openModal(encounter?: EncounterItem): void {
  modal.open({
    component: 'Encounter',
    header: t(`components.encounterModal.${encounter ? 'update' : 'add'}`),
    events: { finished: () => refreshData() },
    ...(encounter && { props: { encounter } }),
    ...(props.campaignView && {
      props: {
        campaignId: encounter?.campaign?.id,
      },
    }),
  })
}

async function deleteItems(ids: number[]): Promise<void> {
  const amount = ids.length
  const type = t(`general.${amount > 1 ? 'encounters' : 'encounter'}`).toLowerCase()

  ask({
    title: `${amount} ${type}`,
  }, async (confirmed: boolean) => {
    if (!confirmed) return

    try {
      await encounter.deleteEncounter(ids)
      refreshData()
    }
    catch (err) {
      toast.error()
    }
  })
}
</script>

<template>
  <AnimationExpand>
    <RefreshCard
      v-if="status === 'error'"
      @refresh="refreshData()"
    />
  </AnimationExpand>
  <LimitCta
    v-if="campaignView && count >= encounter.max"
    ref="limitCta"
  />
  <DataTable
    ref="table"
    v-model:sort-by="sortBy"
    v-model:acs="sortACS"
    v-model:search="search"
    :headers="[
      { label: t('general.name'), sort: true, id: 'title' },
      ...(props.campaignView ? [] : [{ label: t('general.campaign'), sort: false, id: 'campaign.title' }]),
      { label: t('general.rows'), sort: false, id: 'rows' },
      { label: t('general.members'), sort: false, id: 'team' },
      { label: '', sort: false, id: 'actions' },
    ]"
    :items="encounters || []"
    :pages="encounter.pages"
    :per-page="encounter.perPage"
    :total-items="encounter.amount"
    :loading="status === 'pending'"
    :owner="profile.user!.id"
    type="encounter"
    select
    @remove="deleteItems"
    @paginate="page = $event"
  >
    <template #header>
      <ContentCount
        v-if="encounters !== null && profile.data"
        :count="count"
        :max="encounter.max"
      />
      <button
        class="btn-primary"
        :aria-label="t('actions.create')"
        :disabled="status === 'pending'"
        @click="() => {
          count >= encounter.max
            ? limitCta?.show()
            : openModal()
        }"
      >
        {{ t('actions.create') }}
      </button>
    </template>

    <template #default="{ rows }: { rows: EncounterItem[] }">
      <tr
        v-for="(row, i) in rows"
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
            :url="encounterUrl(row)"
            class="underline underline-offset-2 decoration-primary"
          >
            {{ row.title }}
          </RouteLink>
        </td>
        <td
          v-if="!campaignView"
          class="td"
        >
          <RouteLink
            v-if="row.campaign"
            :url="campaignUrl(row, 'content')"
            class="underline underline-offset-2 decoration-primary"
          >
            {{ row.campaign.title }}
          </RouteLink>
        </td>
        <td class="td">
          {{ Array.isArray(row.rows) ? row.rows.length : 0 }}
        </td>
        <td class="td">
          <AvatarGroup
            :key="`${i}-${row.campaign?.id}`"
            :owner="row.created_by"
            :team="row.campaign?.team"
            :fetch-id="
              row.campaign?.team?.some(member => member.user.id === row.created_by.id)
                ? row.campaign.id
                : undefined
            "
          />
        </td>
        <td class="td flex justify-end">
          <button
            v-tippy="t('actions.share')"
            class="icon-btn-success"
            :aria-label="t('actions.share')"
            @click="share(row)"
          >
            <Icon
              name="material-symbols:share"
              class="w-6 h-6"
              aria-hidden="true"
            />
          </button>
          <template v-if="isAdmin(row, profile.user!.id)">
            <button
              v-tippy="t('actions.copy')"
              class="icon-btn-primary"
              :aria-label="t('actions.copy')"
              @click="copy(row)"
            >
              <Icon
                name="material-symbols:content-copy-outline-rounded"
                class="w-6 h-6"
                aria-hidden="true"
              />
            </button>
            <button
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
          </template>
        </td>
      </tr>
    </template>

    <template
      v-if="!encounters?.length && status !== 'pending'"
      #empty
    >
      {{
        t('components.table.nothing', {
          item: t(`general.encounter${(table?.selected || []).length > 1 ? 's' : ''}`).toLowerCase(),
        })
      }}
    </template>
  </DataTable>
</template>
