<script setup lang="ts">
import { m } from 'motion-v'

import type { NuxtError } from '#app'

useSeo('Error')

const props = withDefaults(
  defineProps<{
    error?: NuxtError
  }>(),
  {
    error: undefined,
  },
)

const variant = computed(() => {
  const status = props.error?.status

  if (!status || status === 404) return 'notFound'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'

  return 'generic'
})
</script>

<template>
  <AnimationMotionProvider>
    <div class="flex flex-col items-center min-h-screen">
      <div
        class="flex flex-col gap-y-6 items-center max-w-prose px-8 text-center pt-10"
      >
        <div class="text-[100px] font-black">
          {{ error?.status }}
        </div>
        <h1 test-id="title" class="text-primary">
          {{ $t(`pages.error.${variant}.title`) }}
        </h1>
        <p test-id="text" class="text-muted-foreground">
          {{ $t(`pages.error.${variant}.text`) }}
        </p>
        <div class="flex flex-wrap gap-x-4">
          <UiButton as-child>
            <NuxtLinkLocale to="index" class="w-fit">
              {{ $t('pages.error.goHome') }}
            </NuxtLinkLocale>
          </UiButton>
        </div>
      </div>
      <div class="fixed bottom-0 w-full">
        <m.div
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
              src="/peeker.webp"
              alt="Dragon peeking from the bottom"
              sizes="sm:300px md:300px lg:300px"
              width="2468"
              height="1398"
              class="w-full h-full object-cover"
            />
          </div>
        </m.div>
      </div>
    </div>
  </AnimationMotionProvider>
</template>
