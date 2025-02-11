<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast/use-toast'
import type { DataTable, LimitCta } from '#components'

const props = defineProps<{ campaign?: CampaignFull }>()

const table = ref<InstanceType<typeof DataTable>>()
const limitCta = ref<InstanceType<typeof LimitCta>>()

const { toast } = useToast()
const modal = useModal()
const clipboard = useClipboard()
const { ask } = useConfirm()
const { t, locale } = useI18n()
const user = useAuthenticatedUser()
const queryClient = useQueryClient()

const search = ref<string>('')
const debouncedSearch = refDebounced(search, 500, { maxWait: 1000 })
const sortBy = ref<string>('title')
const sortACS = ref<boolean>(true)
const page = ref<number>(0)

const max = computed<number>(() => getMax('encounter', user.value.subscription_type))
const rowSelection = computed(() => selectedRows(table.value))

const { data: count } = useEncounterCount()
const { mutateAsync: removeEncounter } = useEncounterRemove()
const { mutateAsync: copyEncounter } = useEncounterCopy()

const { data, status } = useEncounterListing(computed(() => ({
  search: debouncedSearch.value,
  sortBy: sortBy.value,
  sortACS: sortACS.value,
  page: page.value,
  eq: props.campaign?.id
    ? { field: 'campaign', value: props.campaign.id }
    : undefined,
})))

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
    if (confirmed) await removeEncounter({ id: ids })
  })
}
</script>

<template>
  <AnimationExpand>
    <RefreshCard
      v-if="status === 'error'"
      @refresh="() => {
        queryClient.invalidateQueries({ queryKey: ['useEncounterListing'] })
        queryClient.invalidateQueries({ queryKey: ['useEncounterCount'] })
      }"
    />
  </AnimationExpand>
  <LimitCta
    v-if="count >= max"
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
    :items="data?.encounters || []"
    :pages="data?.pages || 0"
    :per-page="10"
    :total-items="data?.amount || 0"
    :loading="status === 'pending'"
    type="encounter"
    select
    @remove="deleteItems"
    @paginate="page = $event"
  >
    <template #header>
      <ContentCount
        v-if="data?.encounters !== null && count"
        :count="count"
        :max="max"
      />
      <button
        class="btn-primary"
        :aria-label="t('actions.create')"
        :disabled="status === 'pending' || (campaign && !isAdmin(campaign, user.id))"
        @click="() => (count || 0) >= max ? limitCta?.show() : openModal()"
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
                @click="copyEncounter({ data: row })"
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

    <template #loading>
      <SkeletonEncounterTableRow
        v-for="i in 10"
        :key="i"
      />
    </template>

    <template #empty>
      {{ t('components.table.nothing', { item: t('general.encounter', 2).toLowerCase() }) }}
    </template>
  </DataTable>
</template>
