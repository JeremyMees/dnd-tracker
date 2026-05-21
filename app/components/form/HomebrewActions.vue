<script setup lang="ts">
defineProps<{
  sheet?: InitiativeSheet
}>()

const emptyAction: DndAction = {
  actionType: 'action',
  name: '',
  desc: '',
  attacks: [],
}
</script>

<template>
  <div class="space-y-6">
    <FormRepeaterInput
      name="actions"
      :label="$t('components.inputs.actionsLabel')"
      :empty-object="emptyAction"
    >
      <template #item="{ fieldName }">
        <FormActionInputs :field-name="fieldName" />
      </template>
    </FormRepeaterInput>
  </div>
</template>
