<script setup lang="ts">
defineProps<{ wide?: boolean }>()

const localePath = useLocalePath()
const ui = useUI()

const blob = ref<HTMLDivElement>()

onBeforeMount(() => ui.showNavigation = false)

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
  <div class="min-h-screen relative overflow-hidden">
    <div
      ref="blob"
      class="hidden md:block -z-[1] h-[200px] w-[200px] fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full from-info to-secondary bg-gradient-to-r rotates blur-[100px]"
    />
    <NuxtLink
      class="absolute inset-0 bg-transparent cursor-pointer"
      :to="localePath('/')"
    />
    <div
      class="dnd-container absolute w-full -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
      :class="{
        'max-w-2xl': !wide,
        '': wide,
      }"
    >
      <div class="inset-0 z-[-1] fancy-shadow" />
      <div
        class="bg-tracker/50 px-2 py-6 sm:p-8 rounded-lg relative border-4 border-tracker"
      >
        <img
          src="/gifs/wolf-rider.gif"
          loading="lazy"
          class="w-8 h-8 absolute -top-8"
        >
        <NuxtLink
          :to="localePath('/')"
          class="group"
        >
          <Icon
            name="ic:round-clear"
            class="w-8 h-8 text-danger cursor-pointer absolute right-4 top-4 rounded-full ring-danger group-focus-within:ring"
            aria-hidden="true"
          />
        </NuxtLink>
        <div class="px-4 sm:px-8 mx-h-full overflow-auto max-h-[80vh]">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
