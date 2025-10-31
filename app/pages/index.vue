<script setup lang="ts">
import type { Dragon } from '#components'

useSeo()

const dragon = ref<InstanceType<typeof Dragon>>()
</script>

<template>
  <NuxtLayout no-padding>
    <AnimationBlob />
    <Hero />
    <div class="flex flex-col pb-20 relative overflow-hidden">
      <div
        data-skills
        class="space-y-20 dnd-container"
        @mousemove="dragon && dragon.calculateEyes"
      >
        <LazyTitleText hydrate-on-visible>
          {{ $t('pages.home.textBlock1.title') }}
          <template #text>
            {{ $t('pages.home.textBlock1.text') }}
          </template>
        </LazyTitleText>
        <LazyTitleText hydrate-on-visible>
          {{ $t('pages.home.textBlock2.title') }}
          <template #text>
            {{ $t('pages.home.textBlock2.text') }}
          </template>
        </LazyTitleText>
      </div>
      <LazyDragon
        ref="dragon"
        hydrate-on-visible
      />
      <div class="dnd-container pt-20 md:pt-[200px] flex items-center gap-4">
        <img
          src="/art/flame.svg"
          alt="Hearth"
          class="size-40 hidden md:block"
        >
        <LazySummary
          hydrate-on-visible
          :title="$t('pages.home.summary.title')"
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
      </div>
      <LazyUiContainerScroll hydrate-on-visible>
        <template #title>
          <h2 class="text-4xl font-semibold text-muted-foreground">
            {{ $t('pages.home.containerScroll.title') }}
          </h2>
          <span class="mt-1 font-black text-4xl leading-none md:text-[6rem]">
            {{ $t('pages.home.containerScroll.subtitle') }}
          </span>
        </template>
        <template #card>
          <NuxtImg
            src="/initiative-sheet.png"
            alt="Encounter"
            sizes="sm:1000px md:1000px lg:1000px"
            width="1852"
            height="1168"
            class="mx-auto h-full rounded-2xl object-cover object-top-left"
          />
        </template>
      </LazyUiContainerScroll>
      <LazyCtaBanner
        hydrate-on-visible
        :title="$t('pages.home.ctaBanner.title')"
        :subtitle="$t('pages.home.ctaBanner.text')"
        :button="$t('pages.home.ctaBanner.button')"
      />
      <LazyFaq
        hydrate-on-visible
        :title="$t('pages.home.faq.title')"
        :items="[
          {
            title: $t('pages.home.faq.item1.title'),
            content: $t('pages.home.faq.item1.content'),
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
        class="pb-20 pt-[200px] mx-auto dnd-container"
      />
    </div>
    <div
      class="relative flex size-full flex-col items-center justify-center px-40 pb-40 md:pb-50"
    >
      <span class="text-center head-1 leading-none absolute top-28 min-w-[350px]:top-[100%] z-1 flex flex-col">
        🇧🇪
        <span class="max-w-[200px]">
          {{ $t('pages.home.globe.title') }}
        </span>
      </span>
      <LazyUiGlobe hydrate-on-visible />
    </div>
  </NuxtLayout>
</template>
