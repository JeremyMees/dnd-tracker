<script setup lang="ts">
function start(el: Element): void {
  ;(el as HTMLDivElement).style.height = el.scrollHeight + 'px'
}

function end(el: Element): void {
  ;(el as HTMLDivElement).style.height = ''
}
</script>

<template>
  <Transition
    name="expand-height"
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

* {
  @apply will-change-[height] transform-gpu;
}

.expand-height-leave-active,
.expand-height-enter-active {
  @apply duration-300 transition-[height] overflow-hidden;
}

.expand-height-leave-to,
.expand-height-enter-from {
  @apply h-0!;
}
</style>
