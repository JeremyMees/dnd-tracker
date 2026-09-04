<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    axis?: 'height' | 'width'
  }>(),
  {
    axis: 'height',
  },
)

const name = computed<string>(() =>
  props.axis === 'width' ? 'expand-width' : 'expand',
)

function start(el: Element): void {
  const node = el as HTMLDivElement

  if (props.axis === 'width') node.style.width = node.scrollWidth + 'px'
  else node.style.height = node.scrollHeight + 'px'
}

function end(el: Element): void {
  const node = el as HTMLDivElement

  if (props.axis === 'width') node.style.width = ''
  else node.style.height = ''
}
</script>

<template>
  <Transition
    :name="name"
    @enter="start"
    @after-enter="end"
    @before-leave="start"
    @after-leave="end"
  >
    <slot />
  </Transition>
</template>

<style scoped>
@reference '~/assets/css/global.css';

.expand-leave-active,
.expand-enter-active {
  @apply duration-300 transition-all overflow-hidden will-change-[height] transform-gpu;
}

.expand-leave-to,
.expand-enter-from {
  @apply h-0! opacity-0;
}

.expand-width-leave-active,
.expand-width-enter-active {
  @apply duration-300 transition-all overflow-hidden will-change-[width] transform-gpu;
}

.expand-width-leave-to,
.expand-width-enter-from {
  @apply w-0! opacity-0;
}
</style>
