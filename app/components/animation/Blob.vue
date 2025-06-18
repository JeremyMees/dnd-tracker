<script setup lang="ts">
const showBlob = ref(false)
const blob = ref<HTMLDivElement>()

let mouseMoveHandler: ((event: MouseEvent) => void) | null = null

onMounted(() => {
  const isFirefox = typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent)

  if (!isFirefox) {
    showBlob.value = true

    mouseMoveHandler = (event) => {
      if (blob.value) {
        const { clientX, clientY } = event
        blob.value.animate({
          left: `${clientX}px`,
          top: `${clientY}px`,
        }, { duration: 3000, fill: 'forwards' })
      }
    }

    document.body.addEventListener('mousemove', mouseMoveHandler)
  }
})

onUnmounted(() => {
  if (mouseMoveHandler) {
    document.body.removeEventListener('mousemove', mouseMoveHandler)
  }
})
</script>

<template>
  <div
    v-if="showBlob"
    ref="blob"
    class="hidden md:block -z-[1] h-[200px] w-[200px] fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full from-info to-tertiary bg-gradient-to-r rotates blur-[100px]"
  />
</template>
