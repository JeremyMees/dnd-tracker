<script setup lang="ts">
import type { Dragon } from '#components'

useSeo()

const dragon = ref<InstanceType<typeof Dragon>>()
</script>

<template>
  <NuxtLayout no-padding>
    <AnimationBlob />
    <Hero />
    <div class="flex flex-col pb-20 pt-40 relative overflow-hidden">
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
        <LazyTitleText
          sprite="hearth"
          :button-label="$t('pages.home.textBlock1.button')"
          button-link="/playground"
        >
          {{ $t('pages.home.textBlock1.title') }}
          <template #text>
            {{ $t('pages.home.textBlock1.text') }}
          </template>
        </LazyTitleText>
      </div>
      <LazyDragon ref="dragon" />
      <LazyUiContainerScroll>
        <template #title>
          <h2 class="text-4xl font-semibold">
            {{ $t('pages.home.containerScroll.title') }} <br>
            <span class="mt-1 text-4xl font-bold leading-none md:text-[6rem]">
              {{ $t('pages.home.containerScroll.subtitle') }}
            </span>
          </h2>
        </template>
        <template #card>
          <NuxtImg
            src="/encounter.png"
            alt="Encounter"
            sizes="sm:1000px md:1000px lg:1000px"
            width="1852"
            height="1168"
            class="mx-auto h-full rounded-2xl object-cover object-left-top"
          />
        </template>
      </LazyUiContainerScroll>
      <LazyCtaBanner
        :title="$t('pages.home.ctaBanner.title')"
        :subtitle="$t('pages.home.ctaBanner.text')"
        :button="$t('pages.home.ctaBanner.button')"
      />
      <LazyTitleText
        center
        sprite="bedbug"
        class="dnd-container pt-40"
      >
        {{ $t('pages.home.textBlock2.title') }}
        <template #text>
          {{ $t('pages.home.textBlock2.text') }}
        </template>
      </LazyTitleText>
    </div>
    <div
      class="relative flex size-full flex-col items-center justify-center px-40 pb-40 pt-8 md:pb-60"
    >
      <span class="text-center head-1 leading-none relative z-[1]">
        {{ $t('pages.home.globe.title') }} 🇧🇪
      </span>
      <LazyUiGlobe class="top-10" />
    </div>
  </NuxtLayout>
</template>
