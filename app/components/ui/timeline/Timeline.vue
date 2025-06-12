<script lang="ts" setup>
import { useScroll, useTransform } from 'motion-v'
import type { HTMLAttributes } from 'vue'

const props = withDefaults(
  defineProps<{
    containerClass?: HTMLAttributes['class']
    class?: HTMLAttributes['class']
    items?: {
      id: string
      label: string
    }[]
  }>(), {
    items: () => [],
  },
)

const timelineContainerRef = ref<HTMLElement | null>(null)
const timelineRef = ref<HTMLElement | null>(null)
const height = ref(0)

onMounted(async () => {
  await nextTick()
  if (timelineRef.value) {
    const rect = timelineRef.value.getBoundingClientRect()
    height.value = rect.height
  }
})

const { scrollYProgress } = useScroll({
  target: timelineRef,
  offset: ['start 10%', 'end 50%'],
})

const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1])
let heightTransform = useTransform(scrollYProgress, [0, 1], [0, 0])

watch(height, (newHeight) => {
  heightTransform = useTransform(scrollYProgress, [0, 1], [0, newHeight])
})
</script>

<template>
  <div
    ref="timelineContainerRef"
    class="dnd-container"
  >
    <div
      ref="timelineRef"
      class="relative z-0 mx-auto max-w-7xl"
    >
      <div
        v-for="(item, index) in props.items"
        :key="item.id + index"
        class="flex justify-start pt-10 md:gap-10 md:pt-20 first:pt-0"
      >
        <div class="sticky top-40 z-40 flex max-w-xs flex-col items-center self-start lg:max-w-sm md:w-full md:flex-row">
          <div class="absolute left-3 flex size-10 items-center justify-center rounded-full bg-foreground md:left-3">
            <div class="size-4 rounded-full border border-background bg-background p-2" />
          </div>
          <h3 class="hidden text-xl font-bold text-muted-foreground md:block md:pl-20 md:text-5xl">
            {{ item.label }}
          </h3>
        </div>
        <div class="pl-20 md:pl-0 w-full">
          <slot :name="item.id" />
        </div>
      </div>
      <div
        :style="{
          height: height + 'px',
        }"
        class="absolute left-8 top-0 w-[2px] overflow-hidden bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-0% via-foreground to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] md:left-8"
      >
        <Motion
          as="div"
          :style="{
            height: heightTransform,
            opacity: opacityTransform,
          }"
          class="absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-t from-primary from-0% via-secondary via-10% to-transparent"
        />
      </div>
    </div>
  </div>
</template>
