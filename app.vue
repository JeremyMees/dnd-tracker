<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const profile = useProfile()
const ui = useUI()

profile.fetch()

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

    <ClientOnly>
      <ToastGroup />
      <ConfirmDialogGroup />
      <ModalGroup />
    </ClientOnly>

    <div
      class="flex flex-col min-h-screen"
      :class="{
        'bg-primary/20': ui.bgColor === 'primary',
        'bg-secondary/20': ui.bgColor === 'secondary',
      }"
    >
      <Navbar
        v-show="ui.showNavigation"
        class="fixed z-10 left-0 right-0 backdrop-blur"
      />
      <NuxtPage />
      <Footer v-show="ui.showNavigation" />
    </div>
  </div>
</template>
