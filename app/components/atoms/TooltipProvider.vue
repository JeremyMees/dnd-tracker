<script setup lang="ts">
import type { TooltipProviderProps } from 'reka-ui'

withDefaults(defineProps<TooltipProviderProps>(), {
  delayDuration: 400,
  skipDelayDuration: 300,
})
</script>

<template>
  <UiTooltipProvider
    :delay-duration="delayDuration"
    :skip-delay-duration="skipDelayDuration"
  >
    <slot />
  </UiTooltipProvider>
</template>
