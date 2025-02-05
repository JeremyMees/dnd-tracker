<script setup lang="ts">
useSeo('Playground')

const route = useRoute()
const sheet = useInitiativeSheet()

const { data, status, refresh } = await useAsyncData(
  'initiative-sheet',
  async () => await sheet.get(+route.params.id),
)

async function handleUpdate(payload: Omit<Partial<InitiativeSheet>, NotUpdatable>): Promise<void> {
}
</script>

<template>
  <NuxtLayout
    name="initiative-sidebar"
    title="Playground"
  >
    <InitiativeTable
      v-if="data"
      :data="data"
      @update="handleUpdate"
    />
  </NuxtLayout>
</template>
