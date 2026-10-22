<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <ScrollArea
    data-slot="sidebar-content"
    data-sidebar="content"
    class="min-h-0 flex-1"
    viewport-class="group-data-[collapsible=icon]:overflow-hidden!"
  >
    <div :class="cn('flex flex-col gap-2', props.class)">
      <slot />
    </div>
  </ScrollArea>
</template>
