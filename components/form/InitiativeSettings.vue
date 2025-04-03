<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()

const props = defineProps<{
  sheet?: InitiativeSheet
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}>()

const rowsDefault = ['ac', 'health', 'conditions', 'note', 'deathSaves', 'concentration', 'modify']
const widgetsDefault = ['note', 'info-pins']

interface InitiativeSettingsForm {
  spacing: TableSpacing
  rows: string[]
  widgets: string[]
  pet?: InitiativePet
}

async function handleSettingsSubmit(form: InitiativeSettingsForm, node: FormNode): Promise<void> {
  if (!props.sheet) return

  node.clearErrors()

  await props.update({
    settings: {
      ...sanitizeForm<InitiativeSettingsForm>(form),
      modified: true,
    },
  })

  emit('close')
}
</script>

<template>
  <div class="overflow-y-auto">
    <FormKit
      id="InitiativeSettings"
      type="form"
      :actions="false"
      @submit="handleSettingsSubmit"
    >
      <FormKit
        name="spacing"
        type="radio"
        options-class="flex flex-wrap gap-y-2 gap-x-6"
        :label="$t('components.initiativeSettings.spacing')"
        :value="sheet?.settings?.spacing || 'normal'"
        :options="[
          { label: 'Compact', value: 'compact' },
          { label: 'Normal', value: 'normal' },
          { label: 'Cozy', value: 'cozy' },
        ]"
      />
      <FormKit
        name="rows"
        type="checkbox"
        :label="$t('components.initiativeSettings.rows')"
        :value="sheet?.settings?.modified ? (sheet?.settings?.rows || []) : rowsDefault"
        :options="[
          { label: 'AC', value: 'ac' },
          { label: 'HP', value: 'health' },
          { label: $t('general.condition', 2), value: 'conditions' },
          { label: $t('general.note'), value: 'note' },
          { label: 'Death saves', value: 'deathSaves' },
          { label: $t('general.concentration'), value: 'concentration' },
          { label: $t('general.modify'), value: 'modify' },
        ]"
      />
      <FormKit
        name="widgets"
        type="checkbox"
        options-class="flex flex-wrap gap-y-2 gap-x-6"
        :label="$t('components.initiativeSettings.widgets')"
        :value="sheet?.settings?.modified ? (sheet?.settings?.widgets || []) : widgetsDefault"
        :options="[
          { label: $t('general.note'), value: 'note' },
          { label: $t('general.infoPins'), value: 'info-pins' },
        ]"
      />
      <FormKit
        name="pet"
        type="select"
        :label="$t('components.initiativeSettings.pets.label')"
        :value="sheet?.settings?.pet || undefined"
        :options="[
          { label: $t('general.none'), value: undefined },
          { label: $t('components.initiativeSettings.pets.cat'), value: 'cat' },
          { label: $t('components.initiativeSettings.pets.chicken'), value: 'chicken' },
          { label: $t('components.initiativeSettings.pets.barmaid'), value: 'barmaid' },
          { label: $t('components.initiativeSettings.pets.crawler'), value: 'crawler' },
          { label: $t('components.initiativeSettings.pets.dragon'), value: 'dragon' },
          { label: $t('components.initiativeSettings.pets.fairy'), value: 'fairy' },
          { label: $t('components.initiativeSettings.pets.redcap'), value: 'redcap' },
          { label: $t('components.initiativeSettings.pets.wolf-rider'), value: 'wolf-rider' },
        ]"
        outer-class="$remove:mb-4"
      />
    </FormKit>
  </div>
</template>
