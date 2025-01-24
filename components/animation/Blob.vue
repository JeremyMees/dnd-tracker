<script setup lang="ts">
const blob = ref<HTMLDivElement>()

if (import.meta.client) {
  document.body.onmousemove = (event) => {
    if (blob.value) {
      const { clientX, clientY } = event

      blob.value.animate({
        left: `${clientX}px`,
        top: `${clientY}px`,
      }, { duration: 3000, fill: 'forwards' })
    }
  }
}
</script>

<template>
  <div
    ref="blob"
    class="hidden md:block -z-[1] h-[200px] w-[200px] fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full from-info to-tertiary bg-gradient-to-r rotates blur-[100px]"
  />
</template>
