<script setup lang="ts">
withDefaults(
  defineProps<{
    color?: Color | 'background' | 'secondary'
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
      'border-tertiary bg-tertiary/50': color === 'tertiary' && !noStyling,
      'border-success bg-success/50': color === 'success' && !noStyling,
      'border-info bg-info/50': color === 'info' && !noStyling,
      'border-warning bg-warning/50': color === 'warning' && !noStyling,
      'border-destructive bg-destructive/50': color === 'danger' && !noStyling,
      'border-help bg-help/50': color === 'help' && !noStyling,
      'border-background bg-foreground/50': color === 'background' && !noStyling,
      'border-secondary bg-secondary/50': color === 'secondary' && !noStyling,
    }"
  >
    <slot />
  </div>
</template>
