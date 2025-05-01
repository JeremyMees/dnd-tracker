<script setup lang="ts">
import { changelogs } from '~~/constants/changelogs'

useSeo('Changelogs')
</script>

<template>
  <NuxtLayout shadow>
    <AnimationBlob />
    <ul
      aria-label="Changelog feed"
      role="feed"
      class="relative flex flex-col max-w-4xl mx-auto gap-16 py-12 pl-6 before:absolute before:top-0 before:left-6 before:h-full before:border-2 before:-translate-x-1/2 before:border-secondary"
    >
      <li
        v-for="item in changelogs"
        :id="item.version"
        :key="item.version"
        role="article"
        class="relative pl-10"
      >
        <span class="absolute z-[1] inline-flex items-center justify-center w-10 h-10 rounded-lg bg-tertiary/50 left-0 -translate-x-1/2 border-4 border-tertiary text-white backdrop-blur">
          <Icon
            aria-hidden="true"
            name="tabler:bolt"
            class="h-5 w-5 z-20"
          />
        </span>
        <div class="flex flex-col flex-1 gap-4 border-4 border-secondary bg-secondary/50 rounded-lg p-5 relative -mt-2">
          <div class="flex items-end gap-4 relative">
            <Icon
              aria-hidden="true"
              name="tabler:caret-left-filled"
              class="h-10 w-10 absolute -left-12 text-secondary"
            />
            <p class="font-bold head-2">
              {{ item.version }}
            </p>
            <NuxtTime
              class="text-xs bg-secondary w-fit px-2 py-1 rounded-lg text-muted-foreground"
              :datetime="item.date"
              month="numeric"
              day="numeric"
              year="numeric"
            />
          </div>

          <div class="flex flex-col gap-6">
            <div
              v-for="(feature, i) in item.features"
              :key="i"
              class="flex flex-col gap-1.5"
            >
              <h4
                class="border-4 rounded-lg w-fit px-2 text-white"
                :class="{
                  'border-primary bg-primary/50': feature.title === 'New',
                  'border-warning bg-warning/50': feature.title === 'Bug fixes',
                  'border-help bg-help/50': feature.title === 'Improvements',
                }"
              >
                {{ feature.title }}
              </h4>

              <ul class="pl-6 space-y-1.5 list-disc text-sm marker:text-foreground md:text-base">
                <template
                  v-for="(element, k) in feature.items"
                  :key="k"
                >
                  <li>
                    {{ element.text }}
                  </li>
                </template>
              </ul>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </NuxtLayout>
</template>
