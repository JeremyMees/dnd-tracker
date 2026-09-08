<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { useRandomNames } from '~/queries/names'
import { raceOptions, genderOptions } from '~~/constants/names'

const props = withDefaults(
  defineProps<{
    amount: number
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)

const { copy } = useClipboard()
const { toast } = useToast()
const { t } = useI18n()

const selectedRace = ref<DndRace | 'random'>('random')
const selectedDndGender = ref<DndGender | 'random'>('random')

const { data, refetch } = useRandomNames(
  computed(() => ({
    amount: props.amount,
    race: selectedRace.value,
    gender: selectedDndGender.value,
  })),
)

const names = computed<string[]>(() => data.value ?? [])

function handleCopy(name: string): void {
  copy(name)

  toast({
    title: t('components.nameGenerator.toast.title', { name }),
    variant: 'info',
  })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="flex flex-col gap-2">
        <label v-if="!compact" test-id="label" class="text-sm font-medium">
          Race
        </label>
        <UiSelect v-model="selectedRace">
          <UiSelectTrigger>
            <UiSelectValue />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem
              v-for="option in raceOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </UiSelectItem>
          </UiSelectContent>
        </UiSelect>
      </div>

      <div class="flex flex-col gap-2">
        <label v-if="!compact" test-id="label" class="text-sm font-medium">
          DndGender
        </label>
        <UiSelect v-model="selectedDndGender">
          <UiSelectTrigger>
            <UiSelectValue />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem
              v-for="option in genderOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </UiSelectItem>
          </UiSelectContent>
        </UiSelect>
      </div>
    </div>

    <MasonryGrid
      v-if="names.length"
      v-slot="{ column }"
      :data="names"
      :max-columns="compact ? 1 : 2"
      wrapper-style="grid list-disc list-inside gap-x-6"
      column-style="flex flex-col gap-1"
      element="ol"
    >
      <li
        v-for="name in column"
        :key="name"
        class="cursor-copy hover:bg-muted rounded px-2 transition-colors duration-300"
        :class="compact && 'text-sm'"
        @click="handleCopy(name)"
      >
        {{ name }}
      </li>
    </MasonryGrid>
    <SkeletonList v-else :amount="amount" />

    <div
      test-id="actions"
      class="flex w-full gap-2"
      :class="compact ? '' : 'flex-col mt-4'"
    >
      <div class="text-muted-foreground flex gap-2 items-center">
        <Icon name="tabler:info-circle" class="text-info w-4 min-w-4" />
        <p class="text-xs">
          {{ $t('pages.fantasyNameGenerator.tip') }}
        </p>
      </div>
      <UiButton test-id="generate" class="ml-auto" @click="refetch()">
        {{ $t('actions.generate') }}
      </UiButton>
    </div>
  </div>
</template>
