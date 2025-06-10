<script setup lang="ts">
import { changelogs } from '~~/constants/changelogs'

useSeo('Changelogs')
</script>

<template>
  <NuxtLayout>
    <UiTimeline
      :items="changelogs.map((changelog) => ({
        id: changelog.version,
        label: changelog.version,
      }))"
    >
      <template
        v-for="item in changelogs"
        :key="item.version + 'template'"
        #[item.version]
      >
        <div
          :id="item.version"
          class="flex flex-col flex-1 gap-4 border-4 border-secondary bg-secondary/50 rounded-lg p-5 relative"
        >
          <div class="flex items-center gap-2">
            <h3 class="text-xl font-bold text-foreground md:hidden">
              {{ item.version }}
            </h3>
            <NuxtTime
              class="text-xs bg-background w-fit px-2 py-1 rounded-lg text-foreground"
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
                class="border rounded-full w-fit px-2 py-[2px] text-foreground text-sm font-normal"
                :class="{
                  'border-primary bg-primary/50': feature.title === 'New',
                  'border-warning bg-warning/50': feature.title === 'Bug fixes',
                  'border-help bg-help/50': feature.title === 'Improvements',
                }"
              >
                {{ feature.title }}
              </h4>

              <ul class="pl-6 space-y-1.5 list-disc text-sm marker:text-foreground">
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
      </template>
    </UiTimeline>
  </NuxtLayout>
</template>
