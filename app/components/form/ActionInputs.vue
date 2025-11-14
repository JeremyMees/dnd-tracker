<script setup lang="ts">
import { abilities, abilitiesNames } from '~~/constants/dnd-rules'

defineProps<{ fieldName: string }>()
</script>

<template>
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

    <div class="grid sm:grid-cols-3 gap-x-3 gap-y-2">
      <UiFormField
        v-slot="{ componentField }"
        :name="`${fieldName}.damage_dice`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>
            {{ $t('components.inputs.damageDiceLabel') }}
          </UiFormLabel>
          <UiFormControl>
            <UiInput
              type="text"
              v-bind="componentField"
              placeholder="2d6"
            />
          </UiFormControl>
          <UiFormMessage />
        </UiFormItem>
      </UiFormField>

      <UiFormField
        v-slot="{ componentField }"
        :name="`${fieldName}.damage_bonus`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>
            {{ $t('components.inputs.damageBonusLabel') }}
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
        :name="`${fieldName}.attack_bonus`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>
            {{ $t('components.inputs.attackBonusLabel') }}
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
    </div>

    <div class="grid sm:grid-cols-2 gap-x-3 gap-y-2">
      <UiFormField
        v-slot="{ componentField }"
        :name="`${fieldName}.spell_save`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>
            {{ $t('components.inputs.spellSaveLabel') }}
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
        :name="`${fieldName}.spell_save_type`"
      >
        <UiFormItem>
          <UiFormLabel>
            {{ $t('components.inputs.saveTypeLabel') }}
          </UiFormLabel>
          <UiSelect v-bind="componentField">
            <UiFormControl>
              <UiSelectTrigger>
                <UiSelectValue :placeholder="$t('components.inputs.nothing')" />
              </UiSelectTrigger>
            </UiFormControl>
            <UiSelectContent>
              <UiSelectGroup>
                <UiSelectItem
                  v-for="option in [
                    { label: $t('components.inputs.nothing'), value: 'none' },
                    ...abilities.map((ability, index) => ({
                      label: abilitiesNames[index] || ability,
                      value: ability,
                    })),
                  ]"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </UiSelectItem>
              </UiSelectGroup>
            </UiSelectContent>
          </UiSelect>
          <UiFormMessage />
        </UiFormItem>
      </UiFormField>
    </div>
  </div>
</template>
