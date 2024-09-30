<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (import.meta.client) {
  gsap.registerPlugin(ScrollTrigger)
  ScrollTrigger.getAll().forEach((t: any) => t.kill())
}
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />

    <div class="flex flex-col min-h-screen">
      <Navbar class="fixed z-10 left-0 right-0 backdrop-blur" />
      <NuxtPage />
      <Footer />
    </div>
  </div>
</template>
