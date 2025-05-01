<script setup lang="ts">
import { Motion } from 'motion-v'
import type { NuxtError } from '#app'

defineProps({
  error: Object as () => NuxtError,
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen">
    <div class="flex flex-col gap-y-6 items-center max-w-prose px-8 text-center">
      <div class="text-[100px] font-black pb-10">
        {{ error!.statusCode }}
      </div>
      <h1 class="text-primary">
        {{ $t('pages.error.404') }}
      </h1>
      <p class="text-muted-foreground">
        {{ $t('pages.error.text') }}
      </p>
      <div class="flex flex-wrap gap-x-4 pb-10">
        <NuxtLinkLocale
          to="/"
          class="w-fit btn-primary"
        >
          {{ $t('pages.error.goHome') }}
        </NuxtLinkLocale>
      </div>
    </div>
    <div class="fixed bottom-0 w-full">
      <Motion
        :initial="{ y: '100%' }"
        :animate="{
          y: '0%',
          transition: {
            duration: 0.8,
            ease: 'easeOut',
          },
        }"
      >
        <div class="max-w-[300px] md:max-w-[500px] mx-auto">
          <NuxtImg
            src="/peeker.png"
            alt="Dragon peeking from the bottom"
            sizes="sm:300px md:300px lg:300px"
            width="2468"
            height="1398"
            class="w-full h-full object-cover"
          />
        </div>
      </Motion>
    </div>
  </div>
</template>
