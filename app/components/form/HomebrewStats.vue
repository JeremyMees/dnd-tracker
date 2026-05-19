<script setup lang="ts">
import { abilityTypes, abilityTypeMap, skillMap } from '~~/constants/dnd'
</script>

<template>
  <div class="space-y-6">
    <div>
      <UiLabel>
        {{ $t('general.ability', 2) }}
      </UiLabel>
      <div class="rounded-md border p-3 grid grid-cols-3 sm:grid-cols-6 gap-x-3 gap-y-2">
        <UiFormField
          v-for="short in abilityTypes"
          :key="short"
          v-slot="{ componentField }"
          :name="`abilityScores.${abilityTypeMap[short]}`"
        >
          <UiFormItem v-auto-animate>
            <UiFormLabel>{{ short }}</UiFormLabel>
            <UiFormControl>
              <UiInput
                type="number"
                v-bind="componentField"
              />
            </UiFormControl>
            <UiFormMessage />
          </UiFormItem>
        </UiFormField>
      </div>
    </div>

    <div>
      <UiLabel>
        {{ $t('components.inputs.modifiersLabel') }}
      </UiLabel>
      <div class="rounded-md border p-3 grid grid-cols-3 sm:grid-cols-6 gap-x-3 gap-y-2">
        <UiFormField
          v-for="short in abilityTypes"
          :key="short"
          v-slot="{ componentField }"
          :name="`modifiers.${abilityTypeMap[short]}`"
        >
          <UiFormItem v-auto-animate>
            <UiFormLabel>{{ short }}</UiFormLabel>
            <UiFormControl>
              <UiInput
                type="number"
                v-bind="componentField"
              />
            </UiFormControl>
            <UiFormMessage />
          </UiFormItem>
        </UiFormField>
      </div>
    </div>

    <div>
      <UiLabel>
        {{ $t('general.savingThrow', 2) }}
      </UiLabel>
      <div class="rounded-md border p-3 grid grid-cols-3 sm:grid-cols-6 gap-x-3 gap-y-2">
        <UiFormField
          v-for="short in abilityTypes"
          :key="short"
          v-slot="{ componentField }"
          :name="`savingThrows.${abilityTypeMap[short]}`"
        >
          <UiFormItem v-auto-animate>
            <UiFormLabel>{{ short }}</UiFormLabel>
            <UiFormControl>
              <UiInput
                type="number"
                v-bind="componentField"
              />
            </UiFormControl>
            <UiFormMessage />
          </UiFormItem>
        </UiFormField>
      </div>
    </div>

    <div>
      <UiLabel>
        {{ $t('components.inputs.skillBonusesLabel') }}
      </UiLabel>
      <div class="rounded-md border p-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-2">
        <UiFormField
          v-for="(label, skill) in skillMap"
          :key="skill"
          v-slot="{ componentField }"
          :name="`skillBonuses.${skill}`"
        >
          <UiFormItem v-auto-animate>
            <UiFormLabel>{{ label }}</UiFormLabel>
            <UiFormControl>
              <UiInput
                type="number"
                v-bind="componentField"
              />
            </UiFormControl>
            <UiFormMessage />
          </UiFormItem>
        </UiFormField>
      </div>
    </div>
  </div>
</template>
