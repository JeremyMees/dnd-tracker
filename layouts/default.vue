<script setup lang="ts">
withDefaults(
  defineProps<{
    shadow?: boolean
    noPadding?: boolean
  }>(),
  {
    shadow: false,
    noPadding: false,
  },
)

const store = useUI()

onBeforeMount(() => {
  store.showNavigation = true
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
      <div class="max-container no-scrollbar overflow-y-auto">
        <slot />
      </div>
    </div>
  </main>
</template>
