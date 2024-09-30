<script setup lang="ts">
import { gsap } from 'gsap'

defineExpose({ calculateEyes })

const anchor = ref<HTMLElement>()
const eyeLeft = ref<HTMLElement>()
const eyeRight = ref<HTMLElement>()

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

onMounted(() => {
  nextTick()

  gsap.fromTo(
    '[data-dragon]',
    { y: '50%', x: '25%' },
    {
      scrollTrigger: {
        trigger: '[data-skills]',
        toggleActions: 'restart none none none',
        scrub: 2,
      },
      y: '0%',
      x: '0%',
    },
  )
})
</script>

<template>
  <div
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
        class="w-full h-full object-cover"
      />
    </div>
  </div>
</template>

<style scoped>
.dragon {
  left: calc(100vw - 450px);

  @apply hidden lg:block absolute -rotate-45 w-[600px];
}
</style>
