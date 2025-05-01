<template>
  <UiAuroraBackgroundBase>
    <UiBlurRevealBase>
      <h1 class="mx-auto text-[60px] leading-[60px] md:text-[100px] md:leading-[100px] lg:text-[120px] lg:leading-[120px] text-center max-w-md md:max-w-[1200px] px-4 md:px-6 lg:px-10">
        <span
          v-for="(word, index) in $t('components.hero.start').split(' ')"
          :key="index"
          class="gradient-text inline-block ml-4 first:ml-0"
        >
          {{ word }}
        </span>
      </h1>
    </UiBlurRevealBase>
    <span class="sr-only">
      {{ $t('components.hero.start') }}
    </span>
  </UiAuroraBackgroundBase>
</template>
