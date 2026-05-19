<script setup lang="ts">
import { damageTypes, conditionTypes, resistanceTypeMap } from '~~/constants/dnd'

const emptyTrait = {
  name: '',
  desc: '',
}

const damageOptions = damageTypes.map(d => ({
  label: d.charAt(0).toUpperCase() + d.slice(1),
  value: d,
}))

const conditionOptions = conditionTypes.map(c => ({
  label: c.charAt(0).toUpperCase() + c.slice(1),
  value: c,
}))
</script>

<template>
  <div class="space-y-6">
    <FormRepeaterInput
      name="traits"
      :label="$t('components.inputs.traitsLabel')"
      :empty-object="emptyTrait"
    >
      <template #item="{ fieldName }">
        <div class="flex flex-col gap-2">
          <UiFormField
            v-slot="{ componentField }"
            :name="`${fieldName}.name`"
          >
            <UiFormItem v-auto-animate>
              <UiFormLabel required>
                {{ $t('components.inputs.nameLabel') }}
              </UiFormLabel>
              <UiFormControl>
                <UiInput
                  type="text"
                  v-bind="componentField"
                />
              </UiFormControl>
              <UiFormMessage />
            </UiFormItem>
          </UiFormField>
          <UiFormField
            v-slot="{ componentField }"
            :name="`${fieldName}.desc`"
          >
            <UiFormItem v-auto-animate>
              <UiFormLabel required>
                {{ $t('components.inputs.descriptionLabel') }}
              </UiFormLabel>
              <UiFormControl>
                <UiTextarea v-bind="componentField" />
              </UiFormControl>
              <UiFormMessage />
            </UiFormItem>
          </UiFormField>
        </div>
      </template>
    </FormRepeaterInput>

    <div class="grid sm:grid-cols-2 gap-4">
      <FormCheckboxGroup
        name="resistancesAndImmunities.damageImmunities"
        :label="resistanceTypeMap.damageImmunities"
        :options="damageOptions"
        list-class="grid-cols-2 rounded-md border p-3"
      />
      <FormCheckboxGroup
        name="resistancesAndImmunities.damageResistances"
        :label="resistanceTypeMap.damageResistances"
        :options="damageOptions"
        list-class="grid-cols-2 rounded-md border p-3"
      />
      <FormCheckboxGroup
        name="resistancesAndImmunities.damageVulnerabilities"
        :label="resistanceTypeMap.damageVulnerabilities"
        :options="damageOptions"
        list-class="grid-cols-2 rounded-md border p-3"
      />
      <FormCheckboxGroup
        name="resistancesAndImmunities.conditionImmunities"
        :label="resistanceTypeMap.conditionImmunities"
        :options="conditionOptions"
        list-class="grid-cols-2 rounded-md border p-3"
      />
    </div>
  </div>
</template>
