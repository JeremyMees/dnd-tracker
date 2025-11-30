<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <form
    v-auto-animate
    :class="cn('space-y-4', props.class)"
  >
    <slot />
  </form>
</template>
