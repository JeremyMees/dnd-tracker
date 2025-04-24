<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps({
  error: Object as () => NuxtError,
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen">
    <div class="flex flex-col gap-y-6 items-center max-w-prose px-8 text-center">
      <div class="text-[100px] font-black">
        {{ error!.statusCode }}
      </div>
      <h1 class="text-primary">
        {{ $t('pages.error.404') }}
      </h1>
      <p>
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
  </div>
</template>
