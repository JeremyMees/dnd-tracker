<script setup lang="ts">
const isSmall = useMediaQuery('(max-width: 1024px)')

const isOpen = ref<boolean>(false)
const isMinimized = ref<boolean>(false)

defineExpose({ isMinimized, isOpen })

onKeyStroke('Escape', () => isOpen.value = false)

onMounted(() => {
  setTimeout(() => {
    if (!isSmall.value) isMinimized.value = true
  }, 4000)
})
</script>

<template>
  <div class="max-h-dvh h-full flex flex-col lg:flex-row py-6 lg:py-0 dnd-container lg:max-w-none lg:px-0">
    <div class="flex items-center gap-x-6 pb-4">
      <button
        v-if="isSmall"
        v-tippy="{
          content: $t('components.sidebar.open'),
          placement: 'right',
        }"
        :aria-label="$t('components.sidebar.open')"
        class="icon-btn-primary"
        @click="isOpen = true"
      >
        <Icon
          name="tabler:layout-sidebar"
          class="size-6"
          aria-hidden="true"
        />
      </button>
      <div class="lg:hidden">
        <slot name="sidebar-header" />
      </div>
    </div>
    <AnimationSlideIn position="left">
      <aside
        v-if="(isOpen && isSmall) || !isSmall"
        class="fixed lg:relative top-0 left-0 z-20 max-w-64 h-screen transition-transform translate-x-0 flex"
        aria-label="Sidebar"
      >
        <div class="h-full flex flex-col justify-between px-3 py-4 overflow-y-auto overflow-x-hidden bg-background">
          <slot name="sidebar-content" />
          <div class="space-y-2 font-bold body-small">
            <hr class="border-t-secondary">
            <SidebarItem
              :label="$t('general.back')"
              icon="tabler:arrow-left"
              :minimized="isMinimized"
              @click="$router.back()"
            />
            <SidebarItem
              :label="$t(`actions.${isMinimized ? 'expand' : 'collapse'}`)"
              :icon="`tabler:layout-sidebar-left-${isMinimized ? 'expand' : 'collapse'}`"
              :minimized="isMinimized"
              @click="isMinimized = !isMinimized"
            />
          </div>
        </div>
        <button
          :class="isMinimized ? 'cursor-e-resize' : 'cursor-w-resize'"
          class="w-[2px] bg-secondary"
          @click="isMinimized = !isMinimized"
        />
      </aside>
    </AnimationSlideIn>
    <AnimationOpacity>
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 cursor-pointer z-10"
        @click="isOpen = false"
      />
    </AnimationOpacity>
    <div class="grow bg-background pb-6 pt-4 overflow-y-auto">
      <div class="hidden lg:block pb-4 mb-4 border-secondary border-b-2 px-4">
        <slot name="sidebar-header" />
      </div>
      <div class="px-4">
        <slot />
      </div>
    </div>
  </div>
</template>
