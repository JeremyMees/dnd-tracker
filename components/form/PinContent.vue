<script setup lang="ts">
defineProps<{
  sheet?: InitiativeSheet
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}>()
</script>

<template>
  <DnDContentSearch
    variant="background"
    :sheet="sheet"
    :update="update"
    allow-pin
  />
</template>
