<script setup lang="ts">
defineProps<{
  rotate: number
  scale: number
}>()
</script>

<template>
  <div
    :style="{
      transform: `rotateX(${rotate}deg) scale(${scale})`,
    }"
    class="mx-auto -mt-12 w-full max-w-5xl rounded-[30px] border-4 border-border bg-border/50 p-2 shadow-2xl md:p-6"
  >
    <div class="size-full overflow-hidden">
      <slot />
    </div>
    <UiBorderBeam
      :size="350"
      :duration="12"
      :border-width="4"
      color-from="#7434E3"
      color-to="#9B4BB3"
    />
  </div>
</template>
