<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import type { DataTable, LimitCta } from '#components'

const props = defineProps<{ campaign: CampaignFull }>()

const table = ref<InstanceType<typeof DataTable>>()
const limitCta = ref<InstanceType<typeof LimitCta>>()

const { toast } = useToast()
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
    submit: t(`components.homebrewModal.${item ? 'update' : 'add'}`),
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
    title: `${t('actions.delete')} ${amount} ${type}`,
  }, async (confirmed: boolean) => {
    if (!confirmed) return

    try {
      await homebrew.deleteHomebrew(ids)
      refreshData()
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
            'bg-destructive/20': rowSelection[row.id],
          }"
        >
          <td class="td">
            <div class="max-w-[60px] flex items-center gap-2">
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
                :class="table?.detailRow === row.id ? 'icon-btn-destructive' : 'icon-btn-help'"
                @click="table?.toggleDetailRow(row.id)"
              >
                <Icon
                  name="tabler:chevron-right"
                  aria-hidden="true"
                  :class="{ 'rotate-90': table?.detailRow === row.id }"
                  class="transition-transform duration-200 ease-in-out size-5"
                />
              </button>
            </div>
          </td>
          <td class="td">
            {{ row.name }}
          </td>
          <td class="td">
            <div class="flex items-center gap-2 py-1 px-2 rounded-md text-xs bg-muted w-fit">
              <Icon
                :name="homebrewIcon(row.type)"
                :class="homebrewColor(row.type)"
                class="size-4"
                aria-hidden="true"
              />
              {{ $t(`general.${row.type}`) }}
            </div>
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
                class="size-5"
                aria-hidden="true"
              />
            </NuxtLink>
          </td>
          <td class="td">
            <div class="flex justify-end">
              <button
                v-if="isAdmin(campaign, profile.user!.id)"
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
                class="text-muted-foreground"
              >
                {{ $t('components.homebrewTable.noActions') }}
              </p>
            </div>
            <div class="flex justify-end">
              <button
                class="btn-destructive"
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
