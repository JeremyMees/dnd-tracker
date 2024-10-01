<script setup lang="ts">
withDefaults(
  defineProps<{
    shadow?: boolean
    noPadding?: boolean
    container?: boolean
  }>(),
  {
    shadow: false,
    noPadding: false,
    container: false,
  },
)

const ui = useUI()

onBeforeMount(() => {
  ui.showNavigation = true
})
</script>

<template>
  <main
    class="pb-20 grow"
    :class="{ 'pt-[150px]': !noPadding }"
  >
    <div class="relative">
      <div
        v-if="shadow"
        class="fixed !top-1/4 !left-0 !w-[50vw] !h-[50vh] fancy-shadow z-[-1] opacity-70"
      />
      <div
        class="relative grow pb-[140px] flex flex-col"
        :class="{ 'dnd-container': container }"
      >
        <slot />
      </div>
    </div>
  </main>
</template>
