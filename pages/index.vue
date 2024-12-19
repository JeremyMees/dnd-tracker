<script setup lang="ts">
import { gsap } from 'gsap'
import type { Dragon } from '#components'

useSeo()

// const store = useTableStore()
const toast = useToast()

const dragon = ref<InstanceType<typeof Dragon>>()

try {
  // await store.getSandboxEncounter()
}
catch (err) {
  toast.error()
}

if (import.meta.client) {
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
    <AnimationBlob />
    <Hero />
    <div class="flex flex-col gap-y-[100px] sm:gap-y-[150px] pb-20 pt-28 relative overflow-hidden">
      <div
        data-skills
        class="space-y-20 dnd-container"
        @mousemove="dragon && dragon.calculateEyes"
      >
        <LazySummary
          :title="$t('pages.home.summary.title')"
          sprite="flame"
          :items="[
            $t('pages.home.summary.item1'),
            $t('pages.home.summary.item2'),
            $t('pages.home.summary.item3'),
            $t('pages.home.summary.item4'),
            $t('pages.home.summary.item5'),
            $t('pages.home.summary.item6'),
          ]"
          class="max-w-prose"
        />
        <LazyTitleText sprite="hearth">
          {{ $t('pages.home.textBlock1.title') }}
          <template #text>
            {{ $t('pages.home.textBlock1.text') }}
            <span class="mt-3">
              {{ $t('pages.home.textBlock1.text2') }}
            </span>
          </template>
        </LazyTitleText>
      </div>
      <LazyDragon ref="dragon" />
      <LazyCtaBanner
        :title="$t('pages.home.textBlock2.title')"
        :subtitle="$t('pages.home.textBlock2.text')"
        :button="$t('pages.home.textBlock2.button')"
      />
      <LazyTitleText
        center
        sprite="bedbug"
        class="dnd-container"
      >
        {{ $t('pages.home.textBlock3.title') }}
        <template #text>
          {{ $t('pages.home.textBlock3.text') }}
        </template>
      </LazyTitleText>
    </div>
  </NuxtLayout>
</template>
