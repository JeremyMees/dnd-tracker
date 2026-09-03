<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import {
  useInitiativeSheetDetail,
  useInitiativeSheetDetailUpdate,
  useInitiativeSheetPatch,
} from '~/queries/initiative-sheets'

definePageMeta({
  auth: true,
  path: '/encounters/:id(\\d+)-:title',
  middleware: ['encounter-access'],
})

const route = useRoute()
const { startTour } = useTour()

const id = validateParamId(route.params.id)
const { data, isPending, isError } = useInitiativeSheetDetail(id)
const { mutateAsync: update } = useInitiativeSheetDetailUpdate()
const { mutateAsync: patch } = useInitiativeSheetPatch()
const { enabled: realtimeData, updateQueryData } = useRealTimeInitiativeSheet(
  id,
  data,
)
const { sync: syncLiveSession } = useLiveSession(id)

useSeo(() => data.value?.title)

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
  rowPatch: Partial<InitiativeSheetRow>,
): Promise<void> {
  if (!data.value) return

  await patch({ id, rowId, patch: rowPatch })
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
      <div class="flex gap-x-4 items-center min-w-0">
        <UiButton
          v-if="!data?.campaign"
          as-child
          variant="foreground-ghost"
          size="icon-sm"
          class="shrink-0"
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
              class="shrink-0"
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
        <h2 class="text-xl text-muted-foreground flex gap-2 min-w-0">
          <span class="hidden md:block shrink-0">
            {{ $t('general.encounter') }}:
          </span>
          <span
            v-if="data?.title"
            test-id="title"
            class="text-foreground truncate"
          >
            {{ data.title }}
          </span>
          <UiSkeleton
            v-else
            test-id="title-loader"
            class="w-[150px] h-9 rounded-full shrink-0"
          />
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
