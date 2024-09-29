<script setup lang="ts">
withDefaults(
  defineProps<{
    shadow?: boolean
  }>(),
  {
    shadow: false,
  },
)

const store = useUI()

onBeforeMount(() => {
  store.showNavigation = true
})
</script>

<template>
  <main class="pt-[150px] pb-20 grow">
    <div class="relative">
      <div
        v-if="shadow"
        class="fixed !top-1/4 !left-0 !w-[50vw] !h-[50vh] fancy-shadow z-[-1] opacity-70"
      />
      <div class="dnd-container no-scrollbar overflow-y-auto">
        <slot />
      </div>
    </div>
  </main>
</template>
