<script setup lang="ts">
withDefaults(
  defineProps<{
    showName?: boolean
  }>(), {
    showName: false,
  },
)
</script>

<template>
  <div class="flex gap-2 items-center">
    <div class="size-8 rounded-full ring-2 ring-bg bg-bg-light animate-pulse ml-1" />
    <div
      v-if="showName"
      class="flex flex-col items-start body-small"
    >
      <div class="w-10 h-6 bg-bg-light animate-pulse" />
      <div class="w-10 h-6 bg-bg-light animate-pulse" />
    </div>
  </div>
</template>
