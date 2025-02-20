<script setup lang="ts">
defineProps<{
  count?: number
  max: number
  loading?: boolean
}>()
</script>

<template>
  <UiSkeleton
    v-if="loading || !count"
    class="w-10 h-4"
  />
  <span
    v-else-if="count"
    class="text-[12px] text-muted-foreground"
    :class="{ '!text-destructive': count >= max }"
  >
    {{ count }}/{{ max }}
  </span>
</template>
