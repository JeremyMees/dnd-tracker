<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/utils/shadcn'
import { ScrollArea } from '@/components/ui/scroll-area'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <ScrollArea
    test-id="dialog-body"
    class="-ml-1 -mr-3 min-h-0 flex-1"
    viewport-class="pl-1 pr-3"
  >
    <div :class="cn(props.class)">
      <slot />
    </div>
  </ScrollArea>
</template>
