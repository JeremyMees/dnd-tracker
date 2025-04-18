<template>
  <UiAuroraBackground>
    <UiBlurReveal>
      <h1 class="font-black mx-auto text-[60px] leading-[60px] md:text-[100px] md:leading-[100px] lg:text-[120px] lg:leading-[120px] text-center max-w-md md:max-w-[1032px]">
        <span
          v-for="(word, index) in $t('components.hero.start').split(' ')"
          :key="index"
          class="gradient-text inline-block"
        >
          {{ word }}&nbsp;
        </span>
      </h1>
    </UiBlurReveal>
    <span class="sr-only">
      {{ $t('components.hero.start') }}
    </span>
  </UiAuroraBackground>
</template>
