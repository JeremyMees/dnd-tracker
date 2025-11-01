<script setup lang="ts">
import { Motion, useScroll, useTransform } from 'motion-v'

const cardRef = ref<HTMLElement>()

const { scrollYProgress } = useScroll({
  target: cardRef,
  offset: ['start end', 'end center'],
})

const animatedRotate = useTransform(scrollYProgress, [0, 1], [20, 0])
const animatedScale = useTransform(scrollYProgress, [0, 1], [1.05, 0.9])
</script>

<template>
  <Motion
    ref="cardRef"
    tag="div"
    :style="{
      rotateX: animatedRotate,
      scale: animatedScale,
      boxShadow:
        '0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003',
    }"
    class="mx-auto -mt-12 w-full max-w-5xl rounded-[30px] border-4 border-border bg-border/50 p-2 md:p-6 shadow-2xl relative"
  >
    <div class="size-full overflow-hidden rounded-2xl">
      <slot />
      <UiBorderBeam
        :size="350"
        :duration="12"
        :border-width="4"
        color-from="#7434E3"
        color-to="#9B4BB3"
        class="-inset-1 rounded-[30px]"
      />
    </div>
  </Motion>
</template>
