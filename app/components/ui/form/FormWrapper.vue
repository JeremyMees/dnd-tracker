<script setup lang="ts">
import 'zod/compile'
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

useZodLocale()
</script>

<template>
  <form v-auto-animate :class="cn('space-y-4', props.class)">
    <slot />
  </form>
</template>
