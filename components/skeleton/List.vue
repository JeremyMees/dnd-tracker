<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number
    amount?: number
  }>(), {
    rows: 2,
    amount: 10,
  },
)
</script>

<template>
  <MasonryGrid
    v-slot="{ column }"
    :data="Array.from({ length: rows * amount }, () => ({}))"
    :max-columns="rows"
    wrapper-style="grid list-inside gap-x-6"
    column-style="flex flex-col gap-1"
    element="ol"
  >
    <li
      v-for="j in column"
      :key="j"
    >
      <div class="animate-pulse rounded-lg bg-bg-light/50 h-6 border-4 border-bg-light" />
    </li>
  </MasonryGrid>
</template>
