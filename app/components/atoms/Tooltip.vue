<script setup lang="ts">
import type { TooltipContentProps, TooltipRootProps } from 'reka-ui'

withDefaults(
  defineProps<{
    text?: string
    side?: TooltipContentProps['side']
    disabled?: TooltipRootProps['disabled']
    shortcut?: string[]
  }>(),
  {
    text: undefined,
    side: 'top',
    disabled: false,
    shortcut: undefined,
  },
)

const { keyLabel } = useShortcutKeys()
</script>

<template>
  <UiTooltip :disabled="disabled">
    <UiTooltipTrigger as-child>
      <slot />
    </UiTooltipTrigger>
    <UiTooltipContent :side="side">
      <slot name="content">
        <span v-if="shortcut" class="flex items-center gap-2">
          {{ text }}
          <UiKbdGroup test-id="tooltip-shortcut">
            <UiKbd v-for="key in shortcut" :key="key">
              {{ keyLabel(key) }}
            </UiKbd>
          </UiKbdGroup>
        </span>
        <template v-else>
          {{ text }}
        </template>
      </slot>
    </UiTooltipContent>
  </UiTooltip>
</template>
