<script setup lang="ts">
import type { TooltipContentProps, TooltipRootProps } from 'reka-ui'

withDefaults(
  defineProps<{
    text?: string
    side?: TooltipContentProps['side']
    disabled?: TooltipRootProps['disabled']
  }>(),
  {
    text: undefined,
    side: 'top',
    disabled: false,
  },
)
</script>

<template>
  <UiTooltip :disabled="disabled">
    <UiTooltipTrigger as-child>
      <slot />
    </UiTooltipTrigger>
    <UiTooltipContent :side="side">
      <slot name="content">
        {{ text }}
      </slot>
    </UiTooltipContent>
  </UiTooltip>
</template>
