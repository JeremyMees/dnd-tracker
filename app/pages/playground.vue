<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { playgroundSheet } from '~~/constants/initiative-playground'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

definePageMeta({ middleware: ['encounter-share-access'] })

useSeo('Playground')

const route = useRoute()
const queryClient = useQueryClient()
const { startTour, tourData, isTourActive } = useTour()

const data = ref<InitiativeSheet>()
const activeRow = ref<InitiativeSheetRow>()
const isPending = ref(true)
const isError = ref(false)

onMounted(() => {
  getQueryData()
  startTour(false)
})

function getQueryData(): void {
  const token = route.query.token as string

  if (token) {
    const encounter = queryClient.getQueryData<InitiativeSheet>(
      queryKeys.initiativeSheetPlayground(token),
    )

    if (encounter) data.value = encounter
    else isError.value = true
  } else data.value = playgroundSheet

  isPending.value = false
}

const sheet = computed({
  get: () => (isTourActive.value ? tourData.value : data.value),
  set: value => {
    if (isTourActive.value) tourData.value = value
    else data.value = value
  },
})

const session = useSheetSession(sheet, memorySheetAdapter(sheet))

provide(INITIATIVE_SHEET, { ...session, activeRow })
</script>

<template>
  <NuxtLayout name="sidebar" :header="$t('components.navbar.playground')">
    <InitiativeTable v-if="!isError" :loading="isPending" />
    <Card
      v-else
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
