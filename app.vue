<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const profile = useProfile()
const ui = useUI()
const { dialogs, handlers } = useConfirmDialogs()

profile.get()

if (import.meta.client) {
  gsap.registerPlugin(ScrollTrigger)
  ScrollTrigger.getAll().forEach((t: any) => t.kill())
}
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator
      color="linear-gradient(to right,#7333E0 70%,#D926AA 100%)"
      error-color="#F87272"
    />

    <UiToaster />
    <ModalGroup />
    <ConfirmDialog
      v-for="dialog in dialogs"
      :key="dialog.uuid"
      v-bind="dialog"
      v-on="handlers"
    />

    <div
      :class="{
        'bg-primary/10': ui.bgColor === 'primary',
        'bg-tertiary/10': ui.bgColor === 'tertiary',
      }"
      class="flex flex-col min-h-screen"
    >
      <WarningBanner />
      <NuxtPage />
    </div>
  </div>
</template>
