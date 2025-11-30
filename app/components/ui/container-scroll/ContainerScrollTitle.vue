<script setup lang="ts">
import { Motion, useScroll, useTransform } from 'motion-v'

const titleRef = ref<HTMLElement>()

const { scrollYProgress } = useScroll({
  target: titleRef,
  offset: ['start end', 'end start'],
})

const animatedY = useTransform(scrollYProgress, [0, 1], [0, -100])
</script>

<template>
  <Motion
    ref="titleRef"
    tag="div"
    :style="{ y: animatedY }"
    class="mx-auto max-w-5xl text-center"
  >
    <slot />
  </Motion>
</template>
