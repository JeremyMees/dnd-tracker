<script setup lang="ts">
import type { InputGroupButtonProps } from '.'
import { Button } from '~/components/ui/button'
import { inputGroupButtonVariants } from '.'

const props = withDefaults(
  defineProps<InputGroupButtonProps & {
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    size: 'icon-xs',
    variant: 'secondary-ghost',
    type: 'button',
  },
)
</script>

<template>
  <Button
    :data-size="props.size"
    :variant="props.variant"
    :type="props.type"
    :class="cn(inputGroupButtonVariants({ size: props.size }), props.class)"
  >
    <slot />
  </Button>
</template>
