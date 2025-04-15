<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const { dialogs, handlers } = useConfirmDialogs()
const route = useRoute()

useHealthCheck()

if (import.meta.client) {
  gsap.registerPlugin(ScrollTrigger)
  ScrollTrigger.getAll().forEach((t: any) => t.kill())
}

const pageName = computed(() => !route.name || typeof route.name !== 'string'
  ? ''
  : route.name.split('___')[0],
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
      <CookieBanner />
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
        'bg-primary/10': ['profile', 'pricing'].includes(pageName),
        'bg-tertiary/10': ['updates-changelog', 'updates-feature-request'].includes(pageName),
      }"
      class="flex flex-col min-h-screen"
    >
      <NuxtPage />
    </div>
  </div>
</template>
