<script setup lang="ts">
import { reset } from '@formkit/core'

const emit = defineEmits<{
  close: []
  finished: [settings: InitiativeSettings]
}>()

const props = defineProps<{
  encounterId: number
  settings: InitiativeSettings
}>()

const sheet = useInitiativeSheet()

const rowsDefault = ['summoner', 'ac', 'health', 'conditions', 'note', 'deathSaves', 'concentration', 'modify']
const widgetsDefault = ['note', 'info-pins', 'fantasy-name-generator']

async function handleSubmit(form: InitiativeSettingsForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    const formData = {
      ...sanitizeForm<InitiativeSettingsForm>(form),
      modified: true,
    }

    await sheet.updateInitiativeSheet({ settings: formData }, props.encounterId)

    emit('finished', formData)
    emit('close')
  }
  catch (err: any) {
    reset('form')
    node.setErrors(err.message)
  }
}
</script>

<template>
  <FormKit
    id="form"
    type="form"
    :submit-label="$t('actions.save')"
    @submit="handleSubmit"
  >
    <FormKit
      name="spacing"
      type="radio"
      options-class="flex flex-wrap gap-y-2 gap-x-6"
      :label="$t('components.initiativeSettings.spacing')"
      :value="settings.spacing || 'normal'"
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
      :value="settings.modified ? (settings.rows || []) : rowsDefault"
      :options="[
        { label: 'Summond by', value: 'summoner' },
        { label: 'AC', value: 'ac' },
        { label: 'HP', value: 'health' },
        { label: 'Conditions', value: 'conditions' },
        { label: 'Note', value: 'note' },
        { label: 'Death saves', value: 'deathSaves' },
        { label: 'Concentration', value: 'concentration' },
        { label: 'Modify', value: 'modify' },
      ]"
    />
    <FormKit
      name="widgets"
      type="checkbox"
      options-class="flex flex-wrap gap-y-2 gap-x-6"
      :label="$t('components.initiativeSettings.widgets')"
      :value="settings.modified ? (settings.widgets || []) : widgetsDefault"
      :options="[
        { label: $t('general.note'), value: 'note' },
        { label: $t('general.infoPins'), value: 'info-pins' },
        { label: $t('general.fantasyNameGenerator'), value: 'fantasy-name-generator' },
      ]"
    />
    <FormKit
      name="pet"
      type="select"
      :label="$t('components.initiativeSettings.pets.label')"
      :value="settings.pet || undefined"
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
    />
  </FormKit>
</template>
