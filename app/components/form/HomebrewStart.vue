<script setup lang="ts">
import { homebrewType } from '~~/constants/validation'

const emit = defineEmits<{
  type: [HomebrewType]
  scratch: []
  monster: [DndMonster]
}>()

const step = defineModel<HomebrewStartStep>('step', { required: true })

const { t } = useI18n()

const typeOptions = computed<ChoiceCardOption<HomebrewType>[]>(() =>
  homebrewType.map(type => ({
    value: type,
    label: t(`general.${type}`),
    description: t(`components.homebrewModal.types.${type}`),
    icon: homebrewIcon(type),
    iconClass: homebrewColor(type),
  })),
)

const sourceOptions = computed<ChoiceCardOption<'scratch' | 'bestiary'>[]>(
  () => [
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
  ],
)

function pickType(type: HomebrewType): void {
  if (type === 'monster') step.value = 'source'
  else emit('type', type)
}

function pickSource(source: 'scratch' | 'bestiary'): void {
  if (source === 'bestiary') step.value = 'bestiary'
  else emit('scratch')
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
