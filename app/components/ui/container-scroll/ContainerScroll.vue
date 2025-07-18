<script setup lang="ts">
import { useWindowSize, useScroll, useElementBounding } from '@vueuse/core'
import { ref, onMounted, onUnmounted, computed } from 'vue'

const containerRef = ref(null)
const isMobile = ref(false)

function updateIsMobile() {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile)
})

const { height } = useWindowSize()
const { y: scrollY } = useScroll(window)
const { bottom } = useElementBounding(containerRef)

const scrollYProgress = computed(() => {
  if (!bottom.value) return 0
  return 1 - Math.max(0, bottom.value - scrollY.value) / height.value
})

const scaleDimensions = computed<[number, number]>(() => (isMobile.value ? [0.7, 0.9] : [1.05, 1]))

const rotate = computed(() => 20 * (1 - scrollYProgress.value))
const scale = computed(() => {
  const [start, end] = scaleDimensions.value
  return start + (end - start) * scrollYProgress.value
})
const translateY = computed(() => -100 * scrollYProgress.value)
</script>

<template>
  <div
    ref="containerRef"
    class="relative flex h-[50rem] items-center justify-center md:h-[80rem] dnd-container"
  >
    <div
      class="relative w-full pt-10 md:pt-40"
      style="perspective: 1000px"
    >
      <UiContainerScrollTitle :translate="translateY">
        <slot name="title" />
      </UiContainerScrollTitle>
      <UiContainerScrollCard
        :rotate="rotate"
        :scale="scale"
      >
        <slot name="card" />
      </UiContainerScrollCard>
    </div>
  </div>
</template>
