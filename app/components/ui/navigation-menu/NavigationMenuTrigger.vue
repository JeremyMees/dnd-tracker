<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import {
  NavigationMenuTrigger,
  type NavigationMenuTriggerProps,
  useForwardProps,
} from 'reka-ui'
import { navigationMenuTriggerStyle } from './index'

const props = withDefaults(
  defineProps<NavigationMenuTriggerProps & {
    class?: HTMLAttributes['class']
    icon?: boolean
    styled?: boolean
  }>(), {
    icon: true,
    styled: true,
  },
)

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <NavigationMenuTrigger
    v-bind="forwardedProps"
    :class="styled ? cn(navigationMenuTriggerStyle(), 'group', props.class) : props.class"
  >
    <slot />
    <Icon
      v-if="icon"
      name="tabler:chevron-down"
      class="relative top-px ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuTrigger>
</template>
