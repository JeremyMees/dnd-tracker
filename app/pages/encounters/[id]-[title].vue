<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import {
  useInitiativeSheetDetail,
  useInitiativeSheetDetailUpdate,
} from '~/queries/initiative-sheets'

definePageMeta({
  auth: true,
  path: '/encounters/:id(\\d+)-:title',
  middleware: ['encounter-access'],
})

const route = useRoute()
useSeo(route.params.title as string)

const { startTour } = useTour()

const id = validateParamId(route.params.id)
const { data, isPending, isError } = useInitiativeSheetDetail(id)
const { mutateAsync: update } = useInitiativeSheetDetailUpdate()
const { enabled: realtimeData, updateQueryData } = useRealTimeInitiativeSheet(
  id,
  data,
)
const { sync: syncLiveSession } = useLiveSession(id)

const activeRow = ref<InitiativeSheetRow>()

onMounted(() => {
  startTour(!!data.value?.campaign)
})

async function handleUpdate(payload: UpdateInitiativeSheetData): Promise<void> {
  if (!data.value) return

  await update({
    data: payload,
    id,
    onSettled: async error => {
      if (!realtimeData.value && !error) updateQueryData(payload)
    },
  })

  syncLiveSession(payload)
}

async function handlePatchRow(
  rowId: string,
  patch: Partial<InitiativeSheetRow>,
): Promise<void> {
  if (!data.value) return

  await handleUpdate({
    rows: data.value.rows.map(row =>
      row.id === rowId ? { ...row, ...patch } : row,
    ),
  })
}

provide(INITIATIVE_SHEET, {
  sheet: data,
  update: handleUpdate,
  patchRow: handlePatchRow,
  activeRow,
})
</script>

<template>
  <NuxtLayout name="sidebar">
    <template #header>
      <div class="flex flex-wrap gap-x-4 gap-y-2 items-center">
        <UiButton
          v-if="!data?.campaign"
          as-child
          variant="foreground-ghost"
          size="icon-sm"
        >
          <NuxtLinkLocale
            v-if="!data?.campaign"
            v-tippy="$t('actions.back')"
            test-id="back"
            to="/encounters"
          >
            <Icon name="tabler:arrow-left" :aria-hidden="true" />
          </NuxtLinkLocale>
        </UiButton>
        <UiDropdownMenu v-else>
          <UiDropdownMenuTrigger as-child>
            <UiButton
              variant="foreground-ghost"
              size="icon-sm"
              :aria-label="$t('actions.back')"
            >
              <Icon name="tabler:arrow-left" :aria-hidden="true" />
            </UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="start">
            <UiDropdownMenuItem>
              <NuxtLinkLocale
                test-id="back-campaign"
                :to="campaignUrl(data.campaign, 'encounters')"
                class="flex items-center gap-2"
              >
                <Icon name="tabler:layout-dashboard" class="size-4 min-w-4" />
                {{
                  $t('pages.encounter.back.campaigns', {
                    campaign: data.campaign?.title,
                  })
                }}
              </NuxtLinkLocale>
            </UiDropdownMenuItem>
            <UiDropdownMenuItem>
              <NuxtLinkLocale
                test-id="back-encounters"
                to="/encounters"
                class="flex items-center gap-2"
              >
                <Icon name="tabler:list-details" class="size-4 min-w-4" />
                {{ $t('pages.encounter.back.encounters') }}
              </NuxtLinkLocale>
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
        <h2 class="text-muted-foreground flex gap-2">
          <span class="hidden md:block"> {{ $t('general.encounter') }}: </span>
          <ClientOnly>
            <span v-if="data?.title" test-id="title" class="text-foreground">
              {{ data.title }}
            </span>
            <UiSkeleton
              v-else
              test-id="title-loader"
              class="w-[150px] h-9 rounded-full"
            />
            <template #fallback>
              <UiSkeleton
                test-id="title-loader"
                class="w-[150px] h-9 rounded-full"
              />
            </template>
          </ClientOnly>
        </h2>
      </div>
    </template>

    <InitiativeTable v-if="!isError" :loading="isPending" :encounter-id="id" />
    <Card
      v-else
      test-id="error"
      color="danger"
      class="h-[40vh] flex flex-col items-center justify-center gap-2"
    >
      <Icon name="tabler:alert-triangle" class="size-10" />
      <p class="head-3">
        {{ $t('general.error.text') }}
      </p>
    </Card>

    <template #sidebar-content="{ isExpanded, toggleSidebar }">
      <EncounterSidebar
        :is-expanded="isExpanded"
        @toggle-sidebar="toggleSidebar"
      />
    </template>
  </NuxtLayout>
</template>
