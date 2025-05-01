<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/utils/shadcn'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <tr :class="cn('border-b border-secondary transition-colors data-[state=selected]:bg-secondary', props.class)">
    <slot />
  </tr>
</template>
