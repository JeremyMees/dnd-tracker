<script setup lang="ts">
withDefaults(
  defineProps<{
    reverse?: boolean
  }>(), {
    reverse: false,
  },
)
</script>

<template>
  <div class="overflow-hidden">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      :enter-from-class="`opacity-0 ${reverse ? 'translate-y-full' : '-translate-y-full'}`"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="opacity-0"
    >
      <slot />
    </Transition>
  </div>
</template>
