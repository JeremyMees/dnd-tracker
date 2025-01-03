<script setup lang="ts">
import { RouteLink } from '#components'

withDefaults(
  defineProps<{
    icon: string
    label: string
    minimized: boolean
    url?: string
    color?: Color | 'white'
  }>(), {
    color: 'white',
  },
)
</script>

<template>
  <component
    :is="url ? RouteLink : 'button'"
    v-tippy="{
      content: minimized ? label : '',
      placement: 'right',
      delay: 0,
    }"
    :url="url"
    :aria-label="label"
    class="whitespace-nowrap flex items-center max-w-none w-full p-2 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white group transition-all duration-300"
  >
    <Icon
      :name="icon"
      aria-hidden="true"
      class="size-6"
      :class="{
        'text-black': color === 'black',
        'text-primary': color === 'primary',
        'text-secondary': color === 'secondary',
        'text-success': color === 'success',
        'text-info': color === 'info',
        'text-warning': color === 'warning',
        'text-danger': color === 'danger',
        'text-help': color === 'help',
        'text-white': color === 'white',
      }"
    />
    <AnimationSlideIn position="left">
      <span
        v-if="!minimized"
        class="ms-3"
      >
        {{ label }}
      </span>
    </AnimationSlideIn>
  </component>
</template>
