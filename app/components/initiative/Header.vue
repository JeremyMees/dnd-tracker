<script setup lang="ts">
defineEmits<{
  previous: []
  next: []
}>()

const props = defineProps<{
  data: InitiativeSheet | undefined
  encounterId?: number
}>()

const { t } = useI18n()

const liveOpen = ref<boolean>(false)
const { open: paletteOpen } = useCommandPalette()
const { keyLabel } = useShortcutKeys()

const difficulty = computed<EncounterDifficulty | undefined>(() =>
  encounterDifficulty(props.data?.rows ?? []),
)

const difficultyClass: Record<DifficultyRating, string> = {
  trivial: 'border-muted bg-muted/50',
  low: 'border-success bg-success/20',
  moderate: 'border-warning bg-warning/20',
  high: 'border-destructive bg-destructive/20',
  extreme: 'border-destructive bg-destructive text-destructive-foreground',
}

const budgetRatings: (keyof ExperienceBudget)[] = ['low', 'moderate', 'high']

useCommands(() => [
  {
    id: 'live-session',
    label: t('components.liveSession.title'),
    icon: 'tabler:broadcast',
    iconClass: 'text-success',
    disabled: !props.encounterId,
    run: () => (liveOpen.value = true),
  },
])
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
    <div class="flex gap-4 items-center">
      <UiPopover v-if="difficulty">
        <UiPopoverTrigger as-child>
          <button
            test-id="difficulty"
            :aria-label="
              $t('components.difficulty.label', {
                rating: $t(
                  `components.difficulty.ratings.${difficulty.rating}`,
                ),
              })
            "
            :class="difficultyClass[difficulty.rating]"
            class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
          >
            <Icon name="tabler:gauge" class="size-4" aria-hidden="true" />
            {{ $t(`components.difficulty.ratings.${difficulty.rating}`) }}
          </button>
        </UiPopoverTrigger>
        <UiPopoverContent test-id="difficulty-details" class="w-72">
          <UiPopoverHeader>
            <UiPopoverTitle>
              {{ $t('components.difficulty.title') }}
            </UiPopoverTitle>
          </UiPopoverHeader>
          <div class="flex flex-col gap-3 text-sm">
            <p test-id="difficulty-experience">
              {{
                $t('components.difficulty.experience', {
                  value: difficulty.experience,
                })
              }}
            </p>
            <ul class="flex flex-col gap-1">
              <li
                v-for="rating in budgetRatings"
                :key="rating"
                test-id="difficulty-budget"
                :class="{ 'font-bold': difficulty.rating === rating }"
                class="flex justify-between"
              >
                <span>{{ $t(`components.difficulty.ratings.${rating}`) }}</span>
                <span class="tabular-nums">
                  {{ difficulty.budget[rating] }} XP
                </span>
              </li>
            </ul>
            <p
              v-if="difficulty.playersWithoutLevel"
              test-id="difficulty-missing-levels"
              class="text-xs text-muted-foreground"
            >
              {{
                $t(
                  'components.difficulty.missingLevels',
                  { count: difficulty.playersWithoutLevel },
                  difficulty.playersWithoutLevel,
                )
              }}
            </p>
          </div>
        </UiPopoverContent>
      </UiPopover>
      <span class="text-muted-foreground">
        {{ $t('general.round') }}:
        <span test-id="round" class="font-bold text-foreground">
          {{ data?.round || 1 }}
        </span>
      </span>
      <UiButton
        id="tour-11"
        test-id="command-palette-trigger"
        variant="secondary"
        size="sm"
        aria-keyshortcuts="Meta+K Control+K"
        @click="paletteOpen = true"
      >
        {{ $t('general.action', 2) }}
        <UiKbdGroup class="hidden sm:inline-flex">
          <UiKbd>{{ keyLabel('MOD') }}</UiKbd>
          <UiKbd>K</UiKbd>
        </UiKbdGroup>
      </UiButton>
      <UiDialog v-if="encounterId" v-model:open="liveOpen">
        <UiDialogScrollContent test-id="live-session-dialog" class="max-w-md">
          <UiDialogHeader class="sr-only">
            <UiDialogTitle>
              {{ $t('components.liveSession.title') }}
            </UiDialogTitle>
            <UiDialogDescription>
              {{ $t('components.liveSession.description') }}
            </UiDialogDescription>
          </UiDialogHeader>
          <LiveSessionPanel :encounter-id="encounterId" :rows="data?.rows" />
        </UiDialogScrollContent>
      </UiDialog>
    </div>
    <div
      id="tour-1"
      class="w-full min-[400px]:w-auto flex gap-2 items-center justify-between bg-primary/50 rounded-lg border-4 border-primary"
    >
      <Tooltip :text="$t('actions.prev')" :shortcut="['SHIFT', '←']">
        <button
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
      </Tooltip>
      <p class="text-sm font-medium">
        {{ $t('components.inputs.initiativeLabel') }}
      </p>
      <Tooltip :text="$t('actions.next')" :shortcut="['SHIFT', '→']">
        <button
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
      </Tooltip>
    </div>
  </div>
</template>
