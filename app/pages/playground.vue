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
const isPending = ref(true)
const isError = ref(false)

onMounted(() => {
  getQueryData()
  startTour(false)
})

function getQueryData(): void {
  const token = route.query.token as string

  if (token) {
    const encounter = queryClient.getQueryData<InitiativeSheet>(['useInitiativeSheetPlayground', token])

    if (encounter) data.value = encounter
    else isError.value = true
  }
  else data.value = playgroundSheet

  isPending.value = false
}

async function handleUpdate(payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>): Promise<void> {
  if (!data.value) return

  data.value = {
    ...data.value,
    ...payload,
    ...(payload.rows && { rows: indexCorrect(payload.rows) }),
  }
}

provide(INITIATIVE_SHEET, {
  sheet: isTourActive.value ? tourData : data,
  update: handleUpdate,
})
</script>

<template>
  <NuxtLayout
    name="sidebar"
    :header="$t('components.navbar.playground')"
  >
    <InitiativeTable
      v-if="!isError"
      :loading="isPending"
    />
    <Card
      v-else
      color="danger"
      class="h-[40vh] flex flex-col items-center justify-center gap-2"
    >
      <Icon
        name="tabler:alert-triangle"
        class="size-10"
      />
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
