<script setup lang="ts">
import type { RadioGroupItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { RadioGroupIndicator, RadioGroupItem, useForwardProps } from 'reka-ui'

const props = defineProps<RadioGroupItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <RadioGroupItem
    v-bind="forwardedProps"
    :class="
      cn(
        'peer aspect-square size-4 min-w-4 rounded-full border border-foreground text-foreground ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  >
    <RadioGroupIndicator
      class="flex items-center justify-center"
    >
      <Icon
        name="tabler:circle-filled"
        class="size-3 min-w-3 text-primary relative bottom-0.25"
      />
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>
