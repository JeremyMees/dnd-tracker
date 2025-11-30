<template>
  <UiAuroraBackground>
    <div class="grid max-w-4xl dnd-container">
      <UiBlurReveal :delay="0.3">
        <h1 class="text-pretty text-center text-4xl font-bold sm:text-5xl sm:font-extrabold md:text-7xl text-foreground">
          {{ $t('components.hero.title') }}
        </h1>
        <p class="mx-auto py-8 max-w-[720px] text-pretty text-center text-lg text-muted-foreground">
          {{ $t('components.hero.description') }}
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <UiButton
            as-child
            size="lg"
            variant="foreground"
          >
            <NuxtLinkLocale
              to="/campaigns"
              class="w-fit"
            >
              {{ $t('components.hero.start') }}
            </NuxtLinkLocale>
          </UiButton>
          <UiButton
            as-child
            size="lg"
          >
            <NuxtLinkLocale
              to="/playground"
              class="flex items-center justify-center gap-2 group w-fit"
            >
              {{ $t('components.hero.try') }}
              <Icon
                name="tabler:arrow-up-right"
                class="size-6 min-w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300"
                :aria-hidden="true"
              />
            </NuxtLinkLocale>
          </UiButton>
        </div>
      </UiBlurReveal>
    </div>
    <span class="sr-only">
      {{ $t('components.hero.title') }}
    </span>
    <span class="sr-only">
      {{ $t('components.hero.description') }}
    </span>
  </UiAuroraBackground>
</template>
