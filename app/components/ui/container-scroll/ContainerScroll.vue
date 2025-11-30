<script setup lang="ts">
const isMobile = ref(false)

function updateIsMobile() {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile)
})
</script>

<template>
  <div class="relative flex h-[60rem] items-center justify-center p-2 md:h-[80rem] md:p-20">
    <div
      class="relative w-full py-10 md:py-40"
      style="perspective: 1000px"
    >
      <UiContainerScrollTitle>
        <slot name="title" />
      </UiContainerScrollTitle>
      <UiContainerScrollCard>
        <slot name="card" />
      </UiContainerScrollCard>
    </div>
  </div>
</template>
