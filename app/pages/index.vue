<script setup lang="ts">
import type { Dragon } from '#components'

useSeo()

const dragon = ref<InstanceType<typeof Dragon>>()
</script>

<template>
  <NuxtLayout no-padding>
    <Hero test-id="hero" />
    <div
      data-skills
      class="relative flex flex-col gap-[120px] overflow-hidden pt-[120px] pb-20 md:gap-[180px] md:pt-[180px]"
      @mousemove="dragon && dragon.calculateEyes"
    >
      <LazyPlayerPortal test-id="player-portal" hydrate-on-visible />

      <LazyFeatureBento test-id="features" hydrate-on-visible />

      <div class="relative lg:min-h-[460px] dnd-container flex items-end">
        <LazyCtaBanner
          test-id="cta-banner"
          hydrate-on-visible
          :title="$t('pages.home.ctaBanner.title')"
          :subtitle="$t('pages.home.ctaBanner.text')"
          :button="$t('pages.home.ctaBanner.button')"
          class="lg:max-w-[calc(100vw-540px)]"
        />
        <LazyDragon ref="dragon" test-id="dragon" hydrate-on-visible />
      </div>

      <LazyFaq
        test-id="faq"
        hydrate-on-visible
        :title="$t('pages.home.faq.title')"
        :items="[
          {
            title: $t('pages.home.faq.item1.title'),
            content: $t('pages.home.faq.item1.content'),
          },
          {
            title: $t('pages.home.faq.item4.title'),
            content: $t('pages.home.faq.item4.content'),
          },
          {
            title: $t('pages.home.faq.item2.title'),
            content: $t('pages.home.faq.item2.content'),
          },
          {
            title: $t('pages.home.faq.item3.title'),
            content: $t('pages.home.faq.item3.content'),
          },
        ]"
        class="mx-auto px-4 md:px-6 lg:px-10 pt-10"
      />
    </div>
  </NuxtLayout>
</template>
