<script setup lang="ts">
import { changelogs } from '~~/constants/changelogs'

useSeo('Changelogs')

const majors = [...new Set(
  changelogs.map(changelog => getMajor(changelog.version)),
)].sort((a, b) => b - a)

const selectedMajor = ref<number>(majors[0] ?? 0)

const sortedChangelogs = computed(() => changelogs
  .filter(changelog => changelog.version.startsWith(`v${selectedMajor.value}.`))
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
)

function getMajor (version: string) {
  const [major] = String(version).replace('v', '').split('.').map(parseInt)
  return major ?? 0
}
</script>

<template>
  <NuxtLayout
    no-padding
    shadow
  >
    <div class="dnd-container pt-25 mb-6 flex flex-col gap-4 max-w-4xl">
      <h1 class="text-3xl font-bold tracking-tight md:text-5xl">
        {{ $t('pages.changelog.title') }}
      </h1>
      <p class="text-muted-foreground text-base max-w-prose">
        {{ $t('pages.changelog.description') }}
      </p>
      <UiSelect v-model="selectedMajor">
        <UiSelectTrigger class="w-[180px]">
          <UiSelectValue />
        </UiSelectTrigger>
        <UiSelectContent>
          <UiSelectGroup>
            <UiSelectItem
              v-for="major in majors"
              :key="major"
              :value="major"
            >
              {{ $t('general.version') }} {{ major }}
            </UiSelectItem>
          </UiSelectGroup>
        </UiSelectContent>
      </UiSelect>
    </div>

    <div class="dnd-container max-w-4xl space-y-16 md:mt-24 md:space-y-24">
      <div
        v-for="(entry, index) in sortedChangelogs"
        :key="index"
        class="relative flex flex-col gap-4 md:flex-row md:gap-16"
      >
        <div class="top-30 flex h-min w-64 shrink-0 items-center gap-4 md:sticky">
          <UiBadge>
            {{ entry.version }}
          </UiBadge>
          <NuxtTime
            class="text-muted-foreground text-xs font-medium"
            :datetime="entry.date"
            month="numeric"
            day="numeric"
            year="numeric"
          />
        </div>
        <div class="flex flex-col gap-4 border-4 border-secondary bg-secondary/50 rounded-lg p-5">
          <div
            v-for="(feature, i) in entry.features"
            :key="i"
            class="flex flex-col gap-1.5 "
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
    </div>
  </NuxtLayout>
</template>
