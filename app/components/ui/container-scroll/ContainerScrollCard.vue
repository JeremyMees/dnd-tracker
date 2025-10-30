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
      boxShadow:
        '0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003',
    }"
    class="mx-auto -mt-12 w-full max-w-5xl rounded-[30px] border-4 border-border bg-border/50 p-2 md:p-6 shadow-2xl"
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
