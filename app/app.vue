<script setup lang="ts">
const { dialogs, handlers } = useConfirmDialogs()
const route = useRoute()

useHealthCheck()

const pageName = computed<string>(() => !route.name || typeof route.name !== 'string'
  ? ''
  : route.name.split('___')[0] ?? '',
)
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator
      color="linear-gradient(to right,#7333E0 70%,#D926AA 100%)"
      error-color="#F87272"
    />

    <ClientOnly>
      <ConsentBanner />
      <UiToaster />
      <ModalGroup />
      <ConfirmDialog
        v-for="dialog in dialogs"
        :key="dialog.uuid"
        v-bind="dialog"
        v-on="handlers"
      />
    </ClientOnly>

    <div
      :class="{
        'bg-primary/10': ['profile', 'pricing', 'updates-feature-request'].includes(pageName),
      }"
      class="flex flex-col min-h-screen"
    >
      <NuxtPage />
    </div>
  </div>
</template>
