<script setup lang="ts">
onMounted(() => checkOpen5e())

useInterval(300000, {
  callback() {
    checkOpen5e()
  },
})

const isOpen5eDown = ref(false)

async function checkOpen5e() {
  try {
    const res = await $fetch('https://api.open5e.com/')
    isOpen5eDown.value = !res
  }
  catch (error) {
    isOpen5eDown.value = true
  }
}
</script>

<template>
  <AnimationReveal>
    <div
      v-if="isOpen5eDown"
      class="bg-warning/50 border-warning backdrop-blur-lg border-b"
    >
      <div class="container-max p-4 flex items-center gap-2">
        <Icon
          name="tabler:alert-triangle"
          class="size-5 min-w-5"
          :aria-hidden="true"
        />
        <div class="flex flex-col gap-1">
          <span class="font-bold text-sm">
            Open5e is Currently slow or unavailable
          </span>
          <span class="text-xs">
            The Open5e API appears to be slow or unavailable, affecting access to D&D content. While our app remains functional, some features relying on this data may be temporarily unavailable.
          </span>
        </div>
      </div>
    </div>
  </AnimationReveal>
</template>
