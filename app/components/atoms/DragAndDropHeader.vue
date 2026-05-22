<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <div class="flex items-center gap-1 px-1">
    <div class="flex items-center gap-1 px-1">
      <span class="drag-handle size-4 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors">
        <Icon name="tabler:grip-vertical" />
      </span>
      <span
        data-test-title
        class="text-sm font-medium pt-0.5"
      >
        {{ title }}
      </span>
    </div>
    <div
      v-if="$slots.default"
      data-test-actions
      class="ml-auto flex items-center gap-1"
    >
      <slot />
    </div>
  </div>
</template>
