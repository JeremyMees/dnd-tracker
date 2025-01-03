<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    position?: Position
  }>(), {
    position: 'top',
  },
)

const animationClass = computed<string>(() => {
  if (props.position === 'top') return '-translate-y-full'
  else if (props.position === 'bottom') return 'translate-y-full'
  else if (props.position === 'left') return '-translate-x-full w-0'
  else return 'translate-x-full w-0'
})
</script>

<template>
  <Transition
    enter-active-class="transform duration-300 ease-in-out"
    :enter-from-class="`!${animationClass} opacity-0`"
    enter-to-class="translate-0 opacity-100"
    leave-active-class="transform duration-300 ease-in-out"
    leave-from-class="translate-0 opacity-100"
    :leave-to-class="`!${animationClass} opacity-0`"
  >
    <slot />
  </Transition>
</template>
