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
      <UiSkeletonBase class="h-6 border-4 rounded-full" />
    </li>
  </MasonryGrid>
</template>
