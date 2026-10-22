<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/utils/shadcn'
import { ScrollArea } from '@/components/ui/scroll-area'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <ScrollArea orientation="horizontal" class="w-full">
    <table :class="cn('w-full caption-bottom text-sm', props.class)">
      <slot />
    </table>
  </ScrollArea>
</template>
