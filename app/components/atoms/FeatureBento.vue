<script setup lang="ts">
import { useReducedMotion } from 'motion-v'

const reduced = useReducedMotion()

const cells = [
  {
    key: 'item1',
    art: '/gifs/dragon.gif',
    to: '/campaigns',
    class:
      'md:col-span-2 lg:col-span-4 border-primary bg-primary/20 tracker-shadow-inset',
  },
  {
    key: 'item2',
    art: '/gifs/crawler.gif',
    to: '/playground',
    class: 'lg:col-span-2 border-secondary bg-secondary/50',
  },
  {
    key: 'item3',
    art: '/gifs/wolf-rider.gif',
    to: '/dnd-content',
    class: 'lg:col-span-2 border-secondary bg-secondary/50',
  },
  {
    key: 'item4',
    art: '/gifs/barmaid.gif',
    to: '/campaigns',
    class: 'lg:col-span-2 border-secondary bg-secondary/50',
  },
  {
    key: 'item5',
    art: '/gifs/fairy.gif',
    to: '/fantasy-name-generator',
    class: 'lg:col-span-2 border-secondary bg-secondary/20',
  },
]

const enter = computed(() =>
  reduced.value ? undefined : { opacity: 0, y: 32 },
)
</script>

<template>
  <section class="dnd-container space-y-12">
    <div class="max-w-prose space-y-2">
      <h3 class="text-2xl font-black tracking-tight text-balance md:text-3xl">
        {{ $t('pages.home.textBlock2.title') }}
      </h3>
      <p class="text-muted-foreground">
        {{ $t('pages.home.textBlock2.text') }}
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      <Motion
        v-for="(cell, index) in cells"
        :key="cell.key"
        as="article"
        test-id="feature-cell"
        :initial="enter"
        :while-in-view="{ opacity: 1, y: 0 }"
        :in-view-options="{ once: true, amount: 0.3 }"
        :transition="{
          duration: 0.6,
          delay: index * 0.08,
          ease: [0.16, 1, 0.3, 1],
        }"
        class="group relative overflow-hidden rounded-lg border-4 transition-colors duration-300"
        :class="cell.class"
      >
        <NuxtLinkLocale :to="cell.to" class="flex h-full flex-col p-6">
          <img
            :src="cell.art"
            alt=""
            loading="lazy"
            class="mb-6 size-12 [image-rendering:pixelated] transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-3 md:group-first:size-20"
          />
          <h3 class="head-5 text-balance">
            {{ $t(`pages.home.features.${cell.key}.title`) }}
          </h3>
          <p class="mt-2 max-w-prose text-sm text-muted-foreground">
            {{ $t(`pages.home.features.${cell.key}.text`) }}
          </p>
          <Icon
            name="tabler:arrow-up-right"
            class="mt-auto size-5 self-end text-muted-foreground opacity-0 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:opacity-100"
            :aria-hidden="true"
          />
        </NuxtLinkLocale>
      </Motion>
    </div>
  </section>
</template>
