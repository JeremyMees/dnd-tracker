<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    horizontal?: boolean
  }>(), {
    horizontal: false,
  },
)

function enter(element: any): void {
  const width = getComputedStyle(element).width
  const height = getComputedStyle(element).height

  if (props.horizontal) {
    element.style.height = height
    element.style.position = 'absolute'
    element.style.visibility = 'hidden'
    element.style.width = 'auto'

    element.style.height = null
    element.style.position = null
    element.style.visibility = null
    element.style.width = 0

    requestAnimationFrame(() => element.style.width = width)
  }
  else {
    element.style.width = width
    element.style.position = 'absolute'
    element.style.visibility = 'hidden'
    element.style.height = 'auto'

    element.style.width = null
    element.style.position = null
    element.style.visibility = null
    element.style.height = 0

    requestAnimationFrame(() => element.style.height = height)
  }
}

function afterEnter(element: any): void {
  if (props.horizontal) element.style.width = 'auto'
  else element.style.height = 'auto'
}

function leave(element: any): void {
  const height = getComputedStyle(element).height
  const width = getComputedStyle(element).width

  if (props.horizontal) {
    element.style.width = width

    requestAnimationFrame(() => element.style.width = 0)
  }
  else {
    element.style.height = height

    requestAnimationFrame(() => element.style.height = 0)
  }
}
</script>

<template>
  <Transition
    :name="horizontal ? 'expend-horizontal' : 'expand'"
    @enter="enter"
    @after-enter="afterEnter"
    @leave="leave"
  >
    <slot />
  </Transition>
</template>

<style scoped>
* {
  @apply will-change-[height] transform-gpu;
}

.expand-enter-active,
.expand-leave-active,
.expend-horizontal-enter-active,
.expend-horizontal-leave-active {
  @apply overflow-hidden transition-all duration-500 ease-in-out;
}

.expand-enter, .expand-leave-to {
  @apply h-0;
}

.expend-horizontal-enter, .expend-horizontal-leave-to {
  @apply w-0;
}
</style>
