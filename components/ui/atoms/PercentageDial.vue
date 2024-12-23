<script setup lang="ts">
const props = defineProps<{
  limit: number
  value: number
}>()

const reversedPercentage = computed<number>(() => {
  const value = Math.round((100 / props.limit) * props.value)
  return value - 100
})
</script>

<template>
  <svg
    class="size-7 -rotate-90"
    viewBox="0 0 36 36"
  >
    <circle
      cx="18"
      cy="18"
      r="16"
      fill="none"
      stroke-width="4"
      class="stroke-current text-slate-700"
    />
    <circle
      cx="18"
      cy="18"
      r="16"
      fill="none"
      stroke-width="4"
      stroke-dasharray="100"
      :stroke-dashoffset="reversedPercentage"
      stroke-linecap="round"
      :class="value === limit ? 'text-danger' : 'text-primary'"
      class="stroke-current duration-300 transition-all"
    />
  </svg>
</template>
