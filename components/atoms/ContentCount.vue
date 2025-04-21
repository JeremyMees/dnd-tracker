<script setup lang="ts">
defineProps<{
  count: number | undefined
  max: number
  loading?: boolean
}>()
</script>

<template>
  <ClientOnly>
    <UiSkeleton
      v-if="loading || !isDefined(count)"
      class="w-10 h-4"
    />
    <span
      v-else-if="isDefined(count)"
      class="text-[12px] text-muted-foreground"
      :class="{ '!text-destructive': count >= max }"
    >
      {{ count }}/{{ max }}
    </span>

    <template #fallback>
      <UiSkeleton class="w-10 h-4" />
    </template>
  </ClientOnly>
</template>
