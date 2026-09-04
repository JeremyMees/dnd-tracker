<script setup lang="ts">
import { animate } from 'motion-v'

const props = withDefaults(
  defineProps<{
    value: number
    duration?: number
    delay?: number
  }>(),
  {
    duration: 0.9,
    delay: 0,
  },
)

const reduced = useReducedMotion()
const instant = computed<boolean>(() => import.meta.server || !!reduced.value)
const display = shallowRef<number>(instant.value ? props.value : 0)

let controls: ReturnType<typeof animate> | undefined

function stop(): void {
  controls?.stop()
  controls = undefined
}

function run(from: number, to: number): void {
  stop()

  if (instant.value || from === to) {
    display.value = to
    return
  }

  controls = animate(from, to, {
    duration: props.duration,
    delay: props.delay,
    ease: [0.16, 1, 0.3, 1],
    onUpdate: latest => {
      display.value = Math.round(latest)
    },
    onComplete: () => {
      display.value = to
    },
  })
}

onMounted(() => run(0, props.value))

watch(
  () => props.value,
  to => run(display.value, to),
)

onScopeDispose(stop)
</script>

<template>
  <span test-id="count-up" class="tabular-nums">{{ display }}</span>
</template>
