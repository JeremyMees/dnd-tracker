<script setup lang="ts">
withDefaults(
  defineProps<{
    block?: boolean
  }>(), {
    block: false,
  },
)
</script>

<template>
  <div
    class="h-12 rounded-lg bg-bg-light animate-pulse"
    :class="[block ? 'w-full': 'w-[120px]']"
  />
</template>
