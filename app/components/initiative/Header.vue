<script setup lang="ts">
defineEmits<{
  reset: [boolean]
  previous: []
  next: []
  toggleHistory: []
}>()

defineProps<{
  data: InitiativeSheet | undefined
  encounterId?: number
  historyOpen?: boolean
}>()

const resetOpen = ref<boolean>(false)
const liveOpen = ref<boolean>(false)
</script>

<template>
  <div
    class="relative flex flex-col min-[400px]:flex-row gap-x-4 gap-y-2 items-center justify-end container-max w-full"
  >
    <InitiativePet
      v-if="data?.settings?.pet"
      test-id="pet"
      :pet="data.settings.pet"
      class="max-[350px]:hidden absolute top-13 sm:top-5 left-4"
    />
    <div class="flex gap-2 items-center">
      <span class="text-muted-foreground">
        {{ $t('general.round') }}:
        <span test-id="round" class="font-bold text-foreground">
          {{ data?.round || 1 }}
        </span>
      </span>
      <UiPopover v-model:open="resetOpen">
        <UiPopoverTrigger as-child>
          <UiButton
            id="tour-11"
            v-tippy="$t('actions.reset')"
            test-id="reset"
            aria-label="Reset rounds"
            :disabled="!data?.rows.length"
            variant="destructive-ghost"
            size="icon-sm"
            class="group"
          >
            <Icon
              name="tabler:refresh"
              class="text-destructive group-hover:text-foreground"
              aria-hidden="true"
            />
          </UiButton>
        </UiPopoverTrigger>
        <UiPopoverContent class="flex flex-col gap-2">
          <button
            test-id="reset-soft"
            :aria-label="$t('components.encounterTable.reset.soft.title')"
            class="flex flex-col gap-2 text-left hover:bg-muted-foreground/10 p-2 rounded-md transition-colors duration-300 ease-in-out"
            @click="($emit('reset', false), (resetOpen = false))"
          >
            <span class="font-bold">
              {{ $t('components.encounterTable.reset.soft.title') }}
            </span>
            <span class="text-muted-foreground text-sm">
              {{ $t('components.encounterTable.reset.soft.description') }}
            </span>
          </button>
          <UiSeparator />
          <button
            test-id="reset-hard"
            :aria-label="$t('components.encounterTable.reset.hard.title')"
            class="flex flex-col gap-2 text-left hover:bg-muted-foreground/10 p-2 rounded-md transition-colors duration-300 ease-in-out"
            @click="($emit('reset', true), (resetOpen = false))"
          >
            <span class="font-bold">
              {{ $t('components.encounterTable.reset.hard.title') }}
            </span>
            <span class="text-muted-foreground text-sm">
              {{ $t('components.encounterTable.reset.hard.description') }}
            </span>
          </button>
        </UiPopoverContent>
      </UiPopover>
      <UiPopover v-if="encounterId" v-model:open="liveOpen">
        <UiPopoverTrigger as-child>
          <UiButton
            v-tippy="$t('components.liveSession.title')"
            test-id="live-session-trigger"
            :aria-label="$t('components.liveSession.title')"
            variant="success-ghost"
            size="icon-sm"
            class="group"
          >
            <Icon
              name="tabler:broadcast"
              class="text-success group-hover:text-foreground"
              aria-hidden="true"
            />
          </UiButton>
        </UiPopoverTrigger>
        <UiPopoverContent>
          <LiveSessionPanel :encounter-id="encounterId" :rows="data?.rows" />
        </UiPopoverContent>
      </UiPopover>
      <UiButton
        v-if="encounterId"
        v-tippy="$t('general.combatLog')"
        test-id="history-trigger"
        :aria-label="$t('general.combatLog')"
        :aria-pressed="historyOpen"
        variant="info-ghost"
        size="icon-sm"
        class="group"
        @click="$emit('toggleHistory')"
      >
        <Icon
          name="tabler:history"
          class="group-hover:text-foreground"
          :class="{ 'text-info': historyOpen }"
          aria-hidden="true"
        />
      </UiButton>
    </div>
    <div
      id="tour-1"
      class="w-full min-[400px]:w-auto flex gap-2 items-center justify-between bg-primary/50 rounded-lg border-4 border-primary"
    >
      <button
        v-tippy="{ content: $t('actions.prev') }"
        test-id="previous"
        :disabled="
          !data?.rows.length || (data?.round === 1 && data?.activeIndex === 0)
        "
        :aria-label="$t('actions.prev')"
        class="group disabled:cursor-not-allowed duration-300 ease-in-out p-1 border-r-4 border-primary flex flex-col items-center"
        @click="$emit('previous')"
      >
        <Icon
          name="tabler:chevron-left"
          class="group-disabled:opacity-50 size-6"
          aria-hidden="true"
        />
      </button>
      <p class="text-sm font-medium">
        {{ $t('components.inputs.initiativeLabel') }}
      </p>
      <button
        v-tippy="{ content: $t('actions.next') }"
        test-id="next"
        :disabled="!data?.rows.length"
        :aria-label="$t('actions.next')"
        class="group disabled:cursor-not-allowed p-1 border-l-4 border-primary flex flex-col items-center"
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
