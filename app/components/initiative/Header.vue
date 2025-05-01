<script setup lang="ts">
defineEmits<{
  reset: [boolean]
  previous: []
  next: []
}>()

defineProps<{ data: InitiativeSheet | undefined }>()

const resetOpen = ref<boolean>(false)
</script>

<template>
  <div class="relative flex flex-col sm:flex-row gap-x-4 gap-y-2 items-center justify-end container-max w-full">
    <InitiativePet
      v-if="data?.settings?.pet"
      :pet="data.settings.pet"
      class="max-[350px]:hidden absolute top-14 sm:top-6 left-4"
    />
    <div class="flex gap-2 items-center">
      <span class="text-muted-foreground">
        {{ $t('general.round') }}:
        <span class="font-bold text-foreground">
          {{ data?.round || 1 }}
        </span>
      </span>
      <UiPopoverBase v-model:open="resetOpen">
        <UiPopoverTrigger as-child>
          <button
            id="tour-11"
            v-tippy="$t('actions.reset')"
            :disabled="!data?.rows.length"
            aria-label="Reset rounds"
            class="icon-btn-destructive"
          >
            <Icon
              name="tabler:refresh"
              class="text-destructive"
              aria-hidden="true"
            />
          </button>
        </UiPopoverTrigger>
        <UiPopoverContent class="flex flex-col gap-2">
          <button
            :aria-label="$t('components.encounterTable.reset.soft.title')"
            class="flex flex-col gap-2 text-left hover:bg-muted-foreground/10 p-2 rounded-md transition-colors duration-300 ease-in-out"
            @click="$emit('reset', false), resetOpen = false"
          >
            <span class="font-bold">
              {{ $t('components.encounterTable.reset.soft.title') }}
            </span>
            <span class="text-muted-foreground text-sm">
              {{ $t('components.encounterTable.reset.soft.description') }}
            </span>
          </button>
          <UiSeparatorBase />
          <button
            :aria-label="$t('components.encounterTable.reset.hard.title')"
            class="flex flex-col gap-2 text-left hover:bg-muted-foreground/10 p-2 rounded-md transition-colors duration-300 ease-in-out"
            @click="$emit('reset', true), resetOpen = false"
          >
            <span class="font-bold">
              {{ $t('components.encounterTable.reset.hard.title') }}
            </span>
            <span class="text-muted-foreground text-sm">
              {{ $t('components.encounterTable.reset.hard.description') }}
            </span>
          </button>
        </UiPopoverContent>
      </UiPopoverBase>
    </div>
    <div
      id="tour-1"
      class="flex gap-2 items-center bg-primary/50 rounded-lg border-4 border-primary"
    >
      <button
        v-tippy="{ content: $t('actions.prev') }"
        :disabled="data?.round === 1 && data?.activeIndex === 0"
        :aria-label="$t('actions.prev')"
        class="group disabled:cursor-not-allowed duration-300 ease-in-out py-1 pl-1 pr-2 border-r-2 border-primary flex flex-col items-center"
        @click="$emit('previous')"
      >
        <Icon
          name="tabler:chevron-left"
          class="group-disabled:opacity-50 size-6"
          aria-hidden="true"
        />
      </button>
      <p class="font-medium px-2">
        {{ $t('components.inputs.initiativeLabel') }}
      </p>
      <button
        v-tippy="{ content: $t('actions.next') }"
        :disabled="!data?.rows.length"
        :aria-label="$t('actions.next')"
        class="group disabled:cursor-not-allowed py-1 pl-2 pr-1 border-l-2 border-primary flex flex-col items-center"
        @click="$emit('next')"
      >
        <Icon
          name="tabler:chevron-right"
          class="group-disabled:opacity-50 size-6"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>
