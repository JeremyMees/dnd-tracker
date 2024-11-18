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
const { ask } = useConfirm()
const { t } = useI18n()

const search = ref<string>('')
const sortBy = ref<string>('title')
const sortACS = ref<boolean>(false)
const page = ref<number>(0)

const { data: encounters, status, refresh } = await useAsyncData(
  'encounters',
  async () => await encounter.fetch({
    search: search.value,
    sortBy: sortBy.value,
    sortACS: sortACS.value,
    page: page.value,
  }),
  {
    watch: [search, sortBy, sortACS, page],
  },
)

watchDebounced(
  search,
  () => refresh(),
  { debounce: 500, maxWait: 1000 },
)

const rowSelection = computed(() => selectedRows(table.value))

function teamAvatars(row: EncounterItem): { username: string, img: string, role: UserRole }[] {
  return sbGetTeamMembers(row).map(({ user, role }) => ({
    username: user.username,
    img: user.avatar,
    role,
  }))
}

function openModal(encounter?: EncounterItem): void {
  modal.open({
    component: 'Encounter',
    header: t(`components.encounterModal.${encounter ? 'update' : 'add'}`),
    events: { finished: () => refresh() },
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
      refresh()
    }
    catch (err) {
      toast.error()
    }
  })
}
</script>

<template>
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
  <LimitCta
    v-if="encounter.amount >= encounter.max"
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
      <span
        v-if="encounters !== null && profile.data"
        class="text-[12px] text-slate-300"
        :class="{ '!text-danger': encounter.amount >= encounter.max }"
      >
        {{ encounter.amount }}/{{ encounter.max }}
      </span>
      <button
        class="btn-primary"
        :aria-label="t('actions.create')"
        :disabled="status === 'pending'"
        @click="() => {
          encounter.amount >= encounter.max
            ? limitCta?.show()
            : openModal()
        }"
      >
        {{ t('actions.create') }}
      </button>
    </template>

    <template #default="{ rows }: { rows: EncounterItem[] }">
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
          {{ row.campaign?.title || '' }}
        </td>
        <td class="td">
          {{ Array.isArray(row.rows) ? row.rows.length : 0 }}
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
