<script setup lang="ts">
withDefaults(
  defineProps<{
    color?: Color | 'background' | 'slate'
    round?: boolean
    noPadding?: boolean
    noStyling?: boolean
  }>(), {
    color: 'black',
    round: false,
    noPadding: false,
    noStyling: false,
  },
)
</script>

<template>
  <div
    class="transition-colors duration-300"
    :class="{
      'border-4': !noStyling,
      'rounded-full': round && !noStyling,
      'rounded-lg': !round && !noStyling,
      'p-4': !noPadding && !noStyling,
      'border-black bg-black/50': color === 'black' && !noStyling,
      'border-primary bg-primary/50': color === 'primary' && !noStyling,
      'border-secondary bg-secondary/50': color === 'secondary' && !noStyling,
      'border-success bg-success/50': color === 'success' && !noStyling,
      'border-info bg-info/50': color === 'info' && !noStyling,
      'border-warning bg-warning/50': color === 'warning' && !noStyling,
      'border-danger bg-danger/50': color === 'danger' && !noStyling,
      'border-help bg-help/50': color === 'help' && !noStyling,
      'border-bg bg-bg-light/50': color === 'background' && !noStyling,
      'border-slate-700 bg-slate-700/50': color === 'slate' && !noStyling,
    }"
  >
    <slot />
  </div>
</template>
