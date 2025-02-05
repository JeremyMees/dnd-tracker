<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import type { DataTable, LimitCta } from '#components'

const props = defineProps<{ campaign?: CampaignFull }>()

const table = ref<InstanceType<typeof DataTable>>()
const limitCta = ref<InstanceType<typeof LimitCta>>()

const { toast } = useToast()
const modal = useModal()
const encounter = useEncounters()
const clipboard = useClipboard()
const { ask } = useConfirm()
const { t, locale } = useI18n()
const user = useAuthenticatedUser()

const search = ref<string>('')
const sortBy = ref<string>('title')
const sortACS = ref<boolean>(true)
const page = ref<number>(0)
const count = ref<number>(await encounter.getCount())

const { data: encounters, status, refresh } = await useAsyncData(
  'encounters',
  async () => await encounter.get({
    search: search.value,
    sortBy: sortBy.value,
    sortACS: sortACS.value,
    page: page.value,
  },
  props.campaign?.id
    ? { field: 'campaign', value: props.campaign.id }
    : undefined,
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
  count.value = await encounter.getCount()
}

async function copy(item: EncounterItem): Promise<void> {
  try {
    await encounter.copyEncounter(item)
    refreshData()
  }
  catch (err) {
    toast({
      title: t('general.error.title'),
      description: t('general.error.text'),
      variant: 'destructive',
    })
  }
}

function share(item: EncounterItem): void {
  clipboard.copy(shareEncounterUrl(item, locale.value))

  toast({
    description: `${item.title} ${t('actions.copyClipboard').toLowerCase()}`,
    variant: 'info',
  })
}

function openModal(item?: EncounterItem): void {
  modal.open({
    component: 'Encounter',
    header: t(`components.encounterModal.${item ? 'update' : 'add'}`),
    submit: t(`pages.encounters.${item ? 'update' : 'add'}`),
    events: { finished: () => refreshData() },
    props: {
      ...(item && { encounter: item }),
      campaignId: props.campaign?.id,
    },
  })
}

async function deleteItems(ids: number[]): Promise<void> {
  const amount = ids.length
  const type = t('general.encounter', amount).toLowerCase()

  ask({
    title: `${t('actions.delete')} ${amount} ${type}`,
  }, async (confirmed: boolean) => {
    if (!confirmed) return

    try {
      await encounter.deleteEncounter(ids)
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
    v-if="count >= encounter.max"
    ref="limitCta"
  />
  <DataTable
    ref="table"
    v-model:sort-by="sortBy"
    v-model:acs="sortACS"
    v-model:search="search"
    :headers="[
      { label: t('general.name'), sort: true, id: 'title' },
      ...(props.campaign ? [] : [{ label: t('general.campaign'), sort: false, id: 'campaign.title' }]),
      { label: t('general.row', 2), sort: false, id: 'rows' },
      { label: t('general.member', 2), sort: false, id: 'team' },
      { label: '', sort: false, id: 'actions' },
    ]"
    :items="encounters || []"
    :pages="encounter.pages"
    :per-page="encounter.perPage"
    :total-items="encounter.amount"
    :loading="status === 'pending'"
    type="encounter"
    select
    @remove="deleteItems"
    @paginate="page = $event"
  >
    <template #header>
      <ContentCount
        v-if="encounters !== null && user"
        :count="count"
        :max="encounter.max"
      />
      <button
        class="btn-primary"
        :aria-label="t('actions.create')"
        :disabled="status === 'pending' || (campaign && !isAdmin(campaign, user.id))"
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
          'bg-destructive/20': rowSelection[row.id],
        }"
      >
        <td class="td max-w-6">
          <FormKit
            v-if="row.campaign ? isAdmin(row.campaign, user.id, true) : row.created_by.id === user.id"
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
          <NuxtLinkLocale
            :to="encounterUrl(row)"
            class="underline underline-offset-2 decoration-primary"
          >
            {{ row.title }}
          </NuxtLinkLocale>
        </td>
        <td
          v-if="!campaign"
          class="td"
        >
          <NuxtLinkLocale
            v-if="row.campaign"
            :to="campaignUrl(row.campaign, 'encounters')"
            class="underline underline-offset-2 decoration-primary"
          >
            {{ row.campaign.title }}
          </NuxtLinkLocale>
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
        <td class="td">
          <div class="flex justify-end">
            <button
              v-tippy="t('actions.share')"
              class="icon-btn-success"
              :aria-label="t('actions.share')"
              @click="share(row)"
            >
              <Icon
                name="tabler:share"
                class="size-5"
                aria-hidden="true"
              />
            </button>
            <template v-if="row.campaign ? isAdmin(row.campaign, user.id, true) : true">
              <button
                v-tippy="t('actions.copy')"
                class="icon-btn-primary"
                :aria-label="t('actions.copy')"
                @click="copy(row)"
              >
                <Icon
                  name="tabler:copy"
                  class="size-5"
                  aria-hidden="true"
                />
              </button>
              <button
                v-tippy="t('actions.update')"
                class="icon-btn-info"
                :aria-label="t('actions.update')"
                @click="openModal(row)"
              >
                <Icon
                  name="tabler:edit"
                  class="size-5"
                  aria-hidden="true"
                />
              </button>
            </template>
          </div>
        </td>
      </tr>
    </template>

    <template
      v-if="!encounters?.length && status !== 'pending'"
      #empty
    >
      {{ t('components.table.nothing', { item: t('general.encounter', 2).toLowerCase() }) }}
    </template>
  </DataTable>
</template>
