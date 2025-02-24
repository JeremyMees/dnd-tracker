<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  button: string
}>()

const { user } = useAuthentication()
</script>

<template>
  <div class="dnd-container max-w-[1600px] relative">
    <div class="grid lg:grid-cols-2 gap-8 p-6 md:p-12 bg-primary/20 backdrop-blur-lg rounded-[32px] overflow-hidden transition-colors duration-300">
      <div class="max-w-prose relative z-[1]">
        <p class="head-1 mb-4 text-foreground">
          {{ title }}
        </p>
        <p class="pb-8 text-muted-foreground">
          {{ subtitle }}
        </p>
        <NuxtLinkLocale
          :to="user ? '/pricing' : '/login'"
          :style="false"
          class="btn-tertiary"
        >
          {{ button }}
        </NuxtLinkLocale>
      </div>
      <div class="relative top-6 left-12 md:top-12 flex justify-end">
        <NuxtImg
          src="/cta.png"
          alt="Cta Banner"
          sizes="sm:1000px md:1000px lg:1000px"
          width="2600"
          height="1440"
          class="rounded-lg"
          loading="lazy"
        />
      </div>
      <div class="absolute inset-0 tracker-shadow-inset border-4 border-primary rounded-[32px]" />
    </div>
  </div>
</template>
