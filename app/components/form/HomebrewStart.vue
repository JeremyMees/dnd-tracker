<script setup lang="ts">
import { homebrewType } from '~~/constants/validation'

const emit = defineEmits<{
  type: [HomebrewType]
  scratch: []
  monster: [DndMonster]
  creature: [HomebrewTransfer]
}>()

const step = defineModel<HomebrewStartStep>('step', { required: true })

const { t } = useI18n()
const transfer = useTransferFile()

const creatures = shallowRef<HomebrewTransfer[]>([])

const typeOptions = computed<ChoiceCardOption<HomebrewType>[]>(() =>
  homebrewType.map(type => ({
    value: type,
    label: t(`general.${type}`),
    description: t(`components.homebrewModal.types.${type}`),
    icon: homebrewIcon(type),
    iconClass: homebrewColor(type),
  })),
)

const sourceOptions = computed<ChoiceCardOption<HomebrewStartSource>[]>(() => [
  {
    value: 'scratch',
    label: t('components.homebrewModal.sources.scratch.label'),
    description: t('components.homebrewModal.sources.scratch.description'),
    icon: 'tabler:pencil-plus',
    iconClass: 'text-primary',
  },
  {
    value: 'bestiary',
    label: t('components.homebrewModal.sources.bestiary.label'),
    description: t('components.homebrewModal.sources.bestiary.description'),
    icon: 'tabler:books',
    iconClass: homebrewColor('monster'),
  },
  {
    value: 'file',
    label: t('components.homebrewModal.sources.file.label'),
    description: t('components.homebrewModal.sources.file.description'),
    icon: 'tabler:file-import',
    iconClass: 'text-info',
  },
])

function pickType(type: HomebrewType): void {
  if (type === 'monster') step.value = 'source'
  else emit('type', type)
}

function pickSource(source: HomebrewStartSource): void {
  if (source === 'scratch') emit('scratch')
  else step.value = source
}

async function readFile(file: File): Promise<void> {
  const items = await transfer.read(file, 'homebrews', Number.POSITIVE_INFINITY)

  if (!items) return

  if (items.length === 1) pickCreature(items[0]!)
  else creatures.value = items
}

function pickCreature(creature: HomebrewTransfer): void {
  emit('creature', creature)
}

function leaveFile(): void {
  creatures.value = []
  step.value = 'source'
}
</script>

<template>
  <ChoiceCards
    v-if="step === 'type'"
    :title="$t('components.homebrewModal.pickType')"
    :description="$t('components.homebrewModal.pickTypeInfo')"
    :options="typeOptions"
    @select="pickType"
  />
  <ChoiceCards
    v-else-if="step === 'source'"
    :title="$t('components.homebrewModal.pickSource')"
    :description="$t('components.homebrewModal.pickSourceInfo')"
    :options="sourceOptions"
    back
    @back="step = 'type'"
    @select="pickSource"
  />
  <div v-else-if="step === 'file'" class="flex flex-col gap-4">
    <StepHeader
      :title="$t('components.homebrewModal.pickFile')"
      :description="$t('components.homebrewModal.pickFileInfo')"
      back
      @back="leaveFile"
    />
    <div>
      <ImportButton :accept="creatureFileTypes" @import="readFile" />
    </div>
    <ul
      v-if="creatures.length"
      test-id="file-creatures"
      class="flex flex-col gap-2"
      :aria-label="$t('components.homebrewModal.pickFileCreature')"
    >
      <li v-for="creature in creatures" :key="creature.name">
        <UiButton
          test-id="file-creature"
          type="button"
          variant="secondary"
          class="w-full justify-start"
          @click="pickCreature(creature)"
        >
          <Icon
            :name="homebrewIcon(creature.type ?? 'monster')"
            :class="homebrewColor(creature.type ?? 'monster')"
            aria-hidden="true"
          />
          {{ creature.name }}
        </UiButton>
      </li>
    </ul>
  </div>
  <div v-else class="flex flex-col gap-4">
    <StepHeader
      :title="$t('components.homebrewModal.pickMonster')"
      back
      @back="step = 'source'"
    >
      <template #description>
        {{ $t('components.homebrewModal.pickMonsterInfo') }}
        <Icon
          name="tabler:wand"
          class="size-4 align-text-bottom text-warning"
          aria-hidden="true"
        />
      </template>
    </StepHeader>
    <FormBestiary
      :addable="false"
      persist="local"
      @remix="$emit('monster', $event)"
    />
  </div>
</template>
