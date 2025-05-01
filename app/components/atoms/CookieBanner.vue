<script setup lang="ts">
const cookiesConsent = useCookie<boolean>('_dndtracker_cookies_consent')
const cookiesSet = useCookie<boolean>('_dndtracker_cookies_set')

function handleConsent(): void {
  cookiesSet.value = true
  cookiesConsent.value = true
}
</script>

<template>
  <div
    v-if="!cookiesSet"
    class="fixed z-50 flex flex-col items-center justify-center p-6 bg-primary/50 border-4 border-primary backdrop-blur rounded-lg gap-y-6 bottom-4 left-4 right-4 lg:flex-row md:justify-between lg:px-10 md:py-8 md:bottom-10 md:left-10 md:right-10"
  >
    <Icon
      name="tabler:cookie"
      class="size-12 min-w-12"
      aria-hidden="true"
    />
    <p>
      {{ $t('components.cookieBanner.text') }}
    </p>
    <div class="inline-flex gap-x-24 md:gap-x-8">
      <NuxtLinkLocale
        to="/policies/cookie"
        class="underline whitespace-pre underline-offset-4"
      >
        {{ $t('components.cookieBanner.policy') }}
      </NuxtLinkLocale>
      <button
        class="underline underline-offset-4"
        @click="handleConsent"
      >
        {{ $t('components.cookieBanner.button') }}
      </button>
    </div>
  </div>
</template>
