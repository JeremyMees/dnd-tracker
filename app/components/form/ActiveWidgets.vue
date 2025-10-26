<script setup lang="ts">
defineProps<{
  settings?: InitiativeSettings
  optionsClass?: string
  fieldsetClass?: string
  noLabel?: boolean
}>()

const widgetsDefault = ['note', 'info-pins']
</script>

<template>
  <FormKit
    name="widgets"
    type="checkbox"
    :options-class="optionsClass"
    :fieldset-class="fieldsetClass"
    :label="noLabel ? '' : $t('components.initiativeSettings.widgets')"
    :value="settings?.modified ? (settings?.widgets || []) : widgetsDefault"
    :options="[
      { label: $t('general.note'), value: 'note' },
      { label: $t('general.infoPins'), value: 'info-pins' },
    ]"
  />
</template>
