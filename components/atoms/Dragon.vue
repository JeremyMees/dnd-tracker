<script setup lang="ts">
import { Motion } from 'motion-v'

defineExpose({ calculateEyes })

const anchor = ref<HTMLElement>()
const eyeLeft = ref<HTMLElement>()
const eyeRight = ref<HTMLElement>()
const dragon = ref<HTMLElement>()

function calculateEyes(e: MouseEvent) {
  if (!anchor.value || !eyeLeft.value || !eyeRight.value) {
    return
  }

  const mouseX = e.clientX
  const mouseY = e.clientY
  const rect = anchor.value.getBoundingClientRect()
  const anchorX = rect.left + rect.width / 2
  const anchorY = rect.top + rect.height / 2
  const angleDeg = angle(mouseX, mouseY, anchorX, anchorY)

  eyeLeft.value.style.transform = `rotate(${90 + angleDeg}deg)`
  eyeRight.value.style.transform = `rotate(${90 + angleDeg}deg)`
}

function angle(cx: number, cy: number, ex: number, ey: number): number {
  return (Math.atan2(ey - cy, ex - cx) * 180) / Math.PI
}
</script>

<template>
  <Motion
    ref="dragon"
    :initial="{ y: '50%', x: '25%', rotate: '-45deg' }"
    :in-view="{
      y: '0%',
      x: '0%',
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    }"
    :exit="{
      y: '50%',
      x: '25%',
      transition: {
        duration: 0.8,
        ease: 'easeIn',
      },
    }"
    data-dragon
    class="dragon"
    @mousemove="calculateEyes"
  >
    <div
      ref="eyeLeft"
      class="absolute top-[55%] left-[54%] pt-2"
    >
      <div class="rounded-full bg-black h-4 w-4" />
    </div>
    <div
      ref="eyeRight"
      class="absolute top-[55%] right-[61%] pt-2"
    >
      <div class="rounded-full bg-black h-4 w-4" />
    </div>
    <div ref="anchor">
      <NuxtImg
        src="/dragon.webp"
        alt="Hero image"
        sizes="sm:500px md:500px lg:500px"
        loading="lazy"
        width="2475"
        height="2100"
        class="w-full h-full object-cover"
      />
    </div>
  </Motion>
</template>

<style scoped>
.dragon {
  left: calc(100vw - 450px);

  @apply hidden lg:block absolute w-[600px];
}
</style>
