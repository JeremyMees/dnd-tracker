<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { raceOptions, genderOptions } from '~~/constants/names'

const props = withDefaults(
  defineProps<{
    amount: number
    compact?: boolean
  }>(), {
    compact: false,
  },
)

const { copy } = useClipboard()
const { toast } = useToast()
const { t } = useI18n()

const names = ref<string[]>([])
const selectedRace = ref<DndRace | 'random'>('random')
const selectedGender = ref<Gender | 'random'>('random')

onMounted(() => generate())

function generate(): void {
  names.value = []

  const race = selectedRace.value === 'random' ? undefined : selectedRace.value
  const gender = selectedGender.value === 'random' ? undefined : selectedGender.value

  for (let i = 0; i < props.amount; i++) {
    names.value.push(randomName(race, gender))
  }
}

function handleCopy(name: string): void {
  copy(name)

  toast({
    title: t('components.nameGenerator.toast.title', { name }),
    variant: 'info',
  })
}

watch([selectedRace, selectedGender], () => {
  generate()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="flex flex-col gap-2">
        <label
          v-if="!compact"
          data-test-label
          class="text-sm font-medium"
        >
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
        <label
          v-if="!compact"
          data-test-label
          class="text-sm font-medium"
        >
          Gender
        </label>
        <UiSelect v-model="selectedGender">
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
    <SkeletonList
      v-else
      :amount="amount"
    />

    <div
      data-test-actions
      class="flex w-full gap-2"
      :class="compact ? '' : 'flex-col mt-4'"
    >
      <div class="text-muted-foreground flex gap-2 items-center">
        <Icon
          name="tabler:info-circle"
          class="text-info w-4 min-w-4"
        />
        <p class="text-xs">
          {{ $t('pages.fantasyNameGenerator.tip') }}
        </p>
      </div>
      <UiButton
        data-test-generate
        :disabled="!names.length"
        class="self-end"
        @click="generate"
      >
        {{ $t('actions.generate') }}
      </UiButton>
    </div>
  </div>
</template>
