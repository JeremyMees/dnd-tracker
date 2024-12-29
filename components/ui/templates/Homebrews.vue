<script setup lang="ts">
import type { DataTable, LimitCta } from '#components'

const props = defineProps<{ campaign: CampaignFull }>()

const table = ref<InstanceType<typeof DataTable>>()
const limitCta = ref<InstanceType<typeof LimitCta>>()

const toast = useToast()
const modal = useModal()
const homebrew = useHomebrews()
const profile = useProfile()
const { ask } = useConfirm()
const { t } = useI18n()

const search = ref<string>('')
const sortBy = ref<string>('name')
const sortACS = ref<boolean>(true)
const page = ref<number>(0)
const count = ref<number>(await homebrew.getCount(props.campaign.id))

const { data: homebrews, status, refresh } = await useAsyncData(
  'homebrews',
  async () => await homebrew.get({
    search: search.value,
    sortBy: sortBy.value,
    sortACS: sortACS.value,
    page: page.value,
  },
  { field: 'campaign', value: props.campaign.id },
  ),
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
  count.value = await homebrew.getCount(props.campaign.id)
}

function openModal(item?: HomebrewItemRow): void {
  modal.open({
    component: 'Homebrew',
    header: t(`components.homebrewModal.${item ? 'update' : 'new'}`),
    events: { finished: () => refreshData() },
    props: {
      campaignId: props.campaign.id,
      count: count.value,
      ...(item && { item }),
    },
  })
}

async function deleteItems(ids: number[]): Promise<void> {
  const amount = ids.length
  const type = t('general.homebrew', amount).toLowerCase()

  ask({
    title: `${amount} ${type}`,
  }, async (confirmed: boolean) => {
    if (!confirmed) return

    try {
      await homebrew.deleteHomebrew(ids)
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
    v-if="count >= homebrew.max"
    ref="limitCta"
  />
  <DataTable
    ref="table"
    v-model:sort-by="sortBy"
    v-model:acs="sortACS"
    v-model:search="search"
    :headers="[
      { label: $t('general.name'), sort: true, id: 'name' },
      { label: $t('general.type'), sort: true, id: 'type' },
      { label: $t('general.player'), sort: true, id: 'player' },
      { label: 'HP', sort: true, id: 'health' },
      { label: 'AC', sort: true, id: 'ac' },
      { label: 'Init mod', sort: true, id: 'initiative_modifier' },
      { label: $t('general.link'), sort: false, id: 'link' },
      { label: '', sort: false, id: 'modify' },
    ]"
    :items="homebrews || []"
    :pages="homebrew.pages"
    :per-page="homebrew.perPage"
    :total-items="homebrew.amount"
    :loading="status === 'pending'"
    :has-rights="isAdmin(campaign, profile.user!.id)"
    type="homebrew"
    select
    @remove="deleteItems"
    @paginate="page = $event"
  >
    <template #header>
      <ContentCount
        v-if="homebrews !== null && profile.data"
        :count="count"
        :max="homebrew.max"
      />
      <button
        class="btn-primary"
        :aria-label="$t('actions.create')"
        :disabled="status === 'pending' || !isAdmin(campaign, profile.user!.id)"
        @click="() => {
          count >= homebrew.max
            ? limitCta?.show()
            : openModal()
        }"
      >
        {{ $t('actions.create') }}
      </button>
    </template>

    <template #default="{ rows }: { rows: HomebrewItemRow[] }">
      <template
        v-for="row in rows"
        :key="row.id"
      >
        <tr
          class="tr transition-colors"
          :class="{
            'bg-danger/20': rowSelection[row.id],
          }"
        >
          <td class="td max-w-[60px] flex flex-col sm:flex-row items-center gap-2">
            <FormKit
              v-if="isAdmin(campaign, profile.user!.id)"
              v-model="rowSelection[row.id]"
              type="checkbox"
              :disabled="status === 'pending'"
              outer-class="$reset !pb-0"
              wrapper-class="$remove:mb-1"
              decorator-class="$remove:mr-2"
              @click="table?.toggleRow(row)"
            />
            <button
              v-tippy="$t(`actions.${table?.detailRow === row.id ? 'hide' : 'show'}`)"
              :aria-label="$t(`actions.${table?.detailRow === row.id ? 'hide' : 'show'}`)"
              :class="table?.detailRow === row.id ? 'icon-btn-danger' : 'icon-btn-help'"
              @click="table?.toggleDetailRow(row.id)"
            >
              <Icon
                name="tabler:chevron-right"
                aria-hidden="true"
                :class="{ 'rotate-90': table?.detailRow === row.id }"
                class="transition-transform duration-200 ease-in-out"
              />
            </button>
          </td>
          <td class="td">
            {{ row.name }}
          </td>
          <td class="td flex items-center gap-2 text-slate-300">
            <Icon
              :name="homebrewIcon(row.type)"
              :class="homebrewColor(row.type)"
              size="20"
              aria-hidden="true"
            />
            {{ $t(`general.${row.type}`) }}
          </td>
          <td class="td">
            {{ row.player || '' }}
          </td>
          <td class="td">
            {{ row.type === 'lair' ? '' : row.health || '' }}
          </td>
          <td class="td">
            {{ row.type === 'lair' ? '' : row.ac || '' }}
          </td>
          <td class="td">
            {{ row.type === 'lair' ? '' : row.initiative_modifier || '' }}
          </td>
          <td class="td">
            <NuxtLink
              v-if="row.link"
              v-tippy="$t('actions.link')"
              :aria-label="$t('actions.link')"
              :to="row.link"
              target="_blank"
              class="icon-btn-success"
            >
              <Icon
                name="tabler:link"
                class="size-6"
                aria-hidden="true"
              />
            </NuxtLink>
          </td>
          <td class="td flex justify-end">
            <button
              v-if="isAdmin(campaign, profile.user!.id)"
              v-tippy="$t('actions.update')"
              class="icon-btn-info"
              :aria-label="$t('actions.update')"
              @click="openModal(row)"
            >
              <Icon
                name="tabler:edit"
                class="size-6"
                aria-hidden="true"
              />
            </button>
          </td>
        </tr>
        <tr
          v-if="table?.detailRow === row.id"
          class="tr"
        >
          <td
            class="td space-y-4 w-full"
            :colspan="10"
          >
            <div class="max-h-[350px] sm:max-h-[600px] overflow-y-auto">
              <ActionsTable
                v-if="row.actions.length || row.legendary_actions.length || row.reactions.length || row.special_abilities.length"
                :actions="row.actions"
                :legendary-actions="row.legendary_actions"
                :reactions="row.reactions"
                :special-abilities="row.special_abilities"
              />
              <p
                v-else
                class="text-slate-300"
              >
                {{ $t('components.homebrewTable.noActions') }}
              </p>
            </div>
            <div class="flex justify-end">
              <button
                class="btn-danger"
                :aria-label="$t('actions.close')"
                @click="table?.toggleDetailRow(row.id)"
              >
                {{ $t('actions.close') }}
              </button>
            </div>
          </td>
        </tr>
      </template>
    </template>

    <template
      v-if="!homebrews?.length && status !== 'pending'"
      #empty
    >
      {{ $t('components.table.nothing', { item: $t('general.homebrew', 2).toLowerCase() }) }}
    </template>
  </DataTable>
</template>
