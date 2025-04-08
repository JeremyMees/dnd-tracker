<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { playgroundSheet } from '~/constants/initiative-playground'

definePageMeta({ middleware: ['encounter-share-access'] })

useSeo('Playground')

const route = useRoute()
const queryClient = useQueryClient()

const data = ref<InitiativeSheet>()
const isPending = ref(true)
const isError = ref(false)

onMounted(async () => {
  const token = route.query.token as string

  if (token) {
    const encounter = queryClient.getQueryData<InitiativeSheet>(['useInitiativeSheetPlayground', token])

    if (encounter) data.value = encounter
    else isError.value = true
  }
  else data.value = playgroundSheet

  isPending.value = false
})

async function handleUpdate(payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>): Promise<void> {
  if (!data.value) return

  data.value = {
    ...data.value,
    ...payload,
  }
}
</script>

<template>
  <NuxtLayout
    name="sidebar"
    :header="$t('components.navbar.playground')"
    only-provided-content
  >
    <InitiativeTable
      v-if="!isError"
      :data="data"
      :update="handleUpdate"
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
        :data="data"
        :update="handleUpdate"
        :is-expanded="isExpanded"
        @toggle-sidebar="toggleSidebar"
      />
    </template>
  </NuxtLayout>
</template>
