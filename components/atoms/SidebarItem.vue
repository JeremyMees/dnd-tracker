<script setup lang="ts">
import { NuxtLinkLocale } from '#components'

withDefaults(
  defineProps<{
    icon: string
    label: string
    minimized: boolean
    url?: string
    color?: Color | 'foreground'
  }>(), {
    color: 'foreground',
  },
)
</script>

<template>
  <component
    :is="url ? NuxtLinkLocale : 'button'"
    v-tippy="{
      content: minimized ? label : '',
      placement: 'right',
      delay: 0,
    }"
    :to="url"
    :aria-label="label"
    class="whitespace-nowrap flex items-center max-w-none w-full p-2 text-muted-foreground rounded-lg hover:bg-secondary hover:text-foreground group transition-all duration-300"
  >
    <Icon
      :name="icon"
      aria-hidden="true"
      class="size-6"
      :class="{
        'text-black': color === 'black',
        'text-primary': color === 'primary',
        'text-tertiary': color === 'tertiary',
        'text-success': color === 'success',
        'text-info': color === 'info',
        'text-warning': color === 'warning',
        'text-destructive': color === 'danger',
        'text-help': color === 'help',
        'text-foreground': color === 'foreground',
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
