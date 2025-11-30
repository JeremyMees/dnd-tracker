<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <kbd
    :class="cn(
      'bg-background text-foreground pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm px-1 text-xs font-medium select-none',
      '[&_svg:not([class*=\'size-\'])]:size-3',
      'in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background',
      props.class,
    )"
  >
    <slot />
  </kbd>
</template>
