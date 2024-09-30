<script setup lang="ts">
import { gsap } from 'gsap'

// const store = useTableStore()
// const toast = useToastStore()
const { t } = useI18n()

const blob = ref<HTMLDivElement>()
const dragon = ref()

// try {
//   await store.getSandboxEncounter()
// }
// catch (err) {
//   console.error(err)
//   toast.error()
// }

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

  gsap.to(
    '.encounter-table',
    {
      rotationX: 0,
      autoAlpha: 1,
      scrollTrigger: {
        trigger: '.encounter-table',
        scrub: 2,
        start: 'top center',
        end: 'bottom bottom',
      },
    },
  )
}
</script>

<template>
  <NuxtLayout no-padding>
    <div
      ref="blob"
      class="hidden md:block -z-[1] h-[200px] w-[200px] fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full from-info to-secondary bg-gradient-to-r rotates blur-[100px]"
    />
    <Hero />
    <LazySummary
      :title="t('pages.home.summary.title')"
      sprite="flame"
      :items="[
        t('pages.home.summary.item1'),
        t('pages.home.summary.item2'),
        t('pages.home.summary.item3'),
        t('pages.home.summary.item4'),
        t('pages.home.summary.item5'),
        t('pages.home.summary.item6'),
      ]"
      class="max-w-prose"
    />
  </NuxtLayout>
</template>
