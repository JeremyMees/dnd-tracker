<script setup lang="ts">
defineProps<{
  translate: number
}>()
</script>

<template>
  <div
    :style="{ transform: `translateY(${translate}px)` }"
    class="mx-auto max-w-5xl text-center"
  >
    <slot />
  </div>
</template>
