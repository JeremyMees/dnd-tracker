<script setup lang="ts">
defineProps<{
  sheet?: InitiativeSheet
}>()

const emptyAction: Omit<Action, 'type'> = {
  name: '',
  desc: '',
  attack_bonus: undefined,
  damage_bonus: undefined,
  damage_dice: undefined,
  spell_save: undefined,
  spell_save_type: undefined,
}
</script>

<template>
  <div class="space-y-6">
    <!-- @vue-generic {Action} -->
    <FormRepeaterInput
      name="actions"
      :label="$t('components.inputs.actionsLabel')"
      :empty-object="{ ...emptyAction, type: 'actions' }"
    >
      <template #item="{ fieldName }">
        <FormActionInputs :field-name="fieldName" />
      </template>
    </FormRepeaterInput>

    <!-- @vue-generic {Action} -->
    <FormRepeaterInput
      name="reactions"
      :label="$t('components.inputs.reactionsLabel')"
      :empty-object="{ ...emptyAction, type: 'reactions' }"
    >
      <template #item="{ fieldName }">
        <FormActionInputs :field-name="fieldName" />
      </template>
    </FormRepeaterInput>

    <!-- @vue-generic {Action} -->
    <FormRepeaterInput
      name="legendary_actions"
      :label="$t('components.inputs.legendaryActionsLabel')"
      :empty-object="{ ...emptyAction, type: 'legendary_actions' }"
    >
      <template #item="{ fieldName }">
        <FormActionInputs :field-name="fieldName" />
      </template>
    </FormRepeaterInput>

    <!-- @vue-generic {Action} -->
    <FormRepeaterInput
      name="special_abilities"
      :label="$t('components.inputs.specialAbilitiesLabel')"
      :empty-object="{ ...emptyAction, type: 'special_abilities' }"
    >
      <template #item="{ fieldName }">
        <FormActionInputs :field-name="fieldName" />
      </template>
    </FormRepeaterInput>
  </div>
</template>
