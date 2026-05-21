<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'
import { useField, useFieldValue } from 'vee-validate'
import { usageTypes } from '~~/constants/dnd'
import { actionType } from '~~/constants/validation'

const props = defineProps<{ fieldName: string }>()

const actionTypeValue = useFieldValue<DndActionType>(`${props.fieldName}.actionType`)

const {
  value: usageLimits,
  handleChange: handleUsageLimitsChange,
} = useField<DndUsageLimits | undefined>(`${props.fieldName}.usageLimits`)

const showLegendaryCost = computed(() =>
  actionTypeValue.value === 'legendaryAction' || actionTypeValue.value === 'mythicAction',
)
const showUsageParam = computed(() =>
  isDefined(usageLimits.value) && usageLimits.value.type !== 'atWill',
)

function handleUsageTypeChange(value: AcceptableValue) {
  if (!value || value === 'none') {
    handleUsageLimitsChange(undefined)
  }
  else {
    handleUsageLimitsChange({
      type: value as DndUsageType,
      param: usageLimits.value?.param ?? 1,
    })
  }
}

function handleUsageParamChange(value: number) {
  if (!usageLimits.value) return

  handleUsageLimitsChange({ ...usageLimits.value, param: value })
}

const emptyAttack: DndAttack = {
  name: '',
  attackType: 'melee',
  distanceUnit: 'feet',
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <UiFormField
      v-slot="{ componentField }"
      :name="`${fieldName}.actionType`"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel required>
          {{ $t('components.inputs.actionTypeLabel') }}
        </UiFormLabel>
        <UiSelect v-bind="componentField">
          <UiFormControl>
            <UiSelectTrigger>
              <UiSelectValue />
            </UiSelectTrigger>
          </UiFormControl>
          <UiSelectContent>
            <UiSelectGroup>
              <UiSelectItem
                v-for="value in actionType"
                :key="value"
                :value="value"
              >
                {{ $t(`general.${value}`) }}
              </UiSelectItem>
            </UiSelectGroup>
          </UiSelectContent>
        </UiSelect>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>

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

    <UiFormField
      v-if="showLegendaryCost"
      v-slot="{ componentField }"
      :name="`${fieldName}.legendaryActionCost`"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel>
          {{ $t('components.inputs.legendaryActionCostLabel') }}
        </UiFormLabel>
        <UiFormControl>
          <UiInput
            type="number"
            v-bind="componentField"
          />
        </UiFormControl>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>

    <UiFormField
      v-slot="{ componentField }"
      :name="`${fieldName}.limitedToForm`"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel>
          {{ $t('components.inputs.limitedToFormLabel') }}
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

    <div class="grid sm:grid-cols-2 gap-x-3 gap-y-2">
      <UiFormItem v-auto-animate>
        <UiFormLabel>
          {{ $t('components.inputs.usageTypeLabel') }}
        </UiFormLabel>
        <UiSelect
          :model-value="usageLimits?.type ?? 'none'"
          @update:model-value="handleUsageTypeChange"
        >
          <UiSelectTrigger>
            <UiSelectValue :placeholder="$t('components.inputs.nothing')" />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectGroup>
              <UiSelectItem value="none">
                {{ $t('components.inputs.nothing') }}
              </UiSelectItem>
              <UiSelectItem
                v-for="type in usageTypes"
                :key="type"
                :value="type"
              >
                {{ $t(`general.${type}`) }}
              </UiSelectItem>
            </UiSelectGroup>
          </UiSelectContent>
        </UiSelect>
      </UiFormItem>

      <UiFormItem
        v-if="showUsageParam"
        v-auto-animate
      >
        <UiFormLabel>
          {{ $t('components.inputs.usageParamLabel') }}
        </UiFormLabel>
        <UiInput
          type="number"
          :model-value="usageLimits?.param"
          @update:model-value="v => handleUsageParamChange(+v)"
        />
      </UiFormItem>
    </div>

    <FormRepeaterInput
      :name="`${fieldName}.attacks`"
      :label="$t('components.inputs.attacksLabel')"
      :empty-object="emptyAttack"
    >
      <template #item="{ fieldName: attackFieldName }">
        <FormAttackInputs :field-name="attackFieldName" />
      </template>
    </FormRepeaterInput>
  </div>
</template>
