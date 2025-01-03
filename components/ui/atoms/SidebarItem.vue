<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: string
    label: string
    minimized: boolean
    color?: Color | 'white'
  }>(), {
    color: 'white',
  },
)
</script>

<template>
  <button
    v-tippy="{
      content: minimized ? label : '',
      placement: 'right',
      delay: 0,
    }"
    :aria-label="label"
    class="whitespace-nowrap flex items-center w-full p-2 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white group transition-all duration-300"
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
  </button>
</template>
