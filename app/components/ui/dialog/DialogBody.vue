<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/utils/shadcn'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div
    test-id="dialog-body"
    :class="cn('-mx-1 min-h-0 flex-1 overflow-y-auto px-1', props.class)"
  >
    <slot />
  </div>
</template>
