<script setup lang="ts">
import { useFieldValue } from 'vee-validate'
import { abilityTypeMap, attackTypes, diceTypes, damageTypes, distanceUnits } from '~~/constants/dnd'

const props = defineProps<{ fieldName: string }>()

const attackTypeValue = useFieldValue<DndAttackType>(`${props.fieldName}.attackType`)

const isMelee = computed(() => attackTypeValue.value === 'melee' || attackTypeValue.value === 'meleeSpell')
const isRanged = computed(() => attackTypeValue.value === 'ranged' || attackTypeValue.value === 'rangedSpell')
const isSpell = computed(() => attackTypeValue.value === 'meleeSpell' || attackTypeValue.value === 'rangedSpell')
const isPhysicalRanged = computed(() => attackTypeValue.value === 'ranged')
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="grid sm:grid-cols-2 gap-x-3 gap-y-2">
      <UiFormField
        v-slot="{ componentField }"
        :name="`${fieldName}.name`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>
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
        :name="`${fieldName}.attackType`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel required>
            {{ $t('components.inputs.attackTypeLabel') }}
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
                  v-for="value in attackTypes"
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
    </div>

    <div class="grid sm:grid-cols-2 gap-x-3 gap-y-2">
      <UiFormField
        v-slot="{ componentField }"
        :name="`${fieldName}.toHitMod`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>
            {{ $t('components.inputs.toHitModLabel') }}
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
        :name="`${fieldName}.distanceUnit`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel required>
            {{ $t('components.inputs.distanceUnitLabel') }}
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
                  v-for="value in distanceUnits"
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
    </div>

    <div
      v-if="isMelee || isRanged || isPhysicalRanged"
      class="grid sm:grid-cols-3 gap-x-3 gap-y-2"
    >
      <UiFormField
        v-if="isMelee"
        v-slot="{ componentField }"
        :name="`${fieldName}.reach`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>
            {{ $t('components.inputs.reachLabel') }}
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
        v-if="isRanged"
        v-slot="{ componentField }"
        :name="`${fieldName}.range`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>
            {{ $t('components.inputs.rangeLabel') }}
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
        v-if="isPhysicalRanged"
        v-slot="{ componentField }"
        :name="`${fieldName}.longRange`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>
            {{ $t('components.inputs.longRangeLabel') }}
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

    <UiFormField
      v-slot="{ value, handleChange }"
      :name="`${fieldName}.targetCreatureOnly`"
    >
      <UiFormItem class="flex items-center gap-2 py-2">
        <UiFormControl>
          <UiCheckbox
            :model-value="value"
            class="mb-0"
            @update:model-value="handleChange"
          />
        </UiFormControl>
        <UiFormLabel>
          {{ $t('components.inputs.targetCreatureOnlyLabel') }}
        </UiFormLabel>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>

    <div class="grid sm:grid-cols-4 gap-x-3 gap-y-2">
      <UiFormField
        v-slot="{ componentField }"
        :name="`${fieldName}.damageDieCount`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>
            {{ $t('components.inputs.damageDieCountLabel') }}
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
        :name="`${fieldName}.damageDieType`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>
            {{ $t('components.inputs.damageDieTypeLabel') }}
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
                  v-for="value in diceTypes"
                  :key="value"
                  :value="value"
                >
                  {{ value }}
                </UiSelectItem>
              </UiSelectGroup>
            </UiSelectContent>
          </UiSelect>
          <UiFormMessage />
        </UiFormItem>
      </UiFormField>

      <UiFormField
        v-slot="{ componentField }"
        :name="`${fieldName}.damageBonus`"
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
        :name="`${fieldName}.damageType`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>
            {{ $t('components.inputs.damageTypeLabel') }}
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
                  v-for="value in damageTypes"
                  :key="value"
                  :value="value"
                >
                  {{ value.charAt(0).toUpperCase() + value.slice(1) }}
                </UiSelectItem>
              </UiSelectGroup>
            </UiSelectContent>
          </UiSelect>
          <UiFormMessage />
        </UiFormItem>
      </UiFormField>
    </div>

    <div class="grid sm:grid-cols-4 gap-x-3 gap-y-2">
      <UiFormField
        v-slot="{ componentField }"
        :name="`${fieldName}.extraDamageDieCount`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>
            {{ $t('components.inputs.extraDamageDieCountLabel') }}
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
        :name="`${fieldName}.extraDamageDieType`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>
            {{ $t('components.inputs.extraDamageDieTypeLabel') }}
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
                  v-for="value in diceTypes"
                  :key="value"
                  :value="value"
                >
                  {{ value }}
                </UiSelectItem>
              </UiSelectGroup>
            </UiSelectContent>
          </UiSelect>
          <UiFormMessage />
        </UiFormItem>
      </UiFormField>

      <UiFormField
        v-slot="{ componentField }"
        :name="`${fieldName}.extraDamageBonus`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>
            {{ $t('components.inputs.extraDamageBonusLabel') }}
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
        :name="`${fieldName}.extraDamageType`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>
            {{ $t('components.inputs.extraDamageTypeLabel') }}
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
                  v-for="value in damageTypes"
                  :key="value"
                  :value="value"
                >
                  {{ value.charAt(0).toUpperCase() + value.slice(1) }}
                </UiSelectItem>
              </UiSelectGroup>
            </UiSelectContent>
          </UiSelect>
          <UiFormMessage />
        </UiFormItem>
      </UiFormField>
    </div>

    <div
      v-if="isSpell"
      class="grid sm:grid-cols-2 gap-x-3 gap-y-2"
    >
      <UiFormField
        v-slot="{ componentField }"
        :name="`${fieldName}.spellSave`"
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
        v-slot="{ value, handleChange }"
        :name="`${fieldName}.spellSaveType`"
      >
        <UiFormItem>
          <UiFormLabel>
            {{ $t('components.inputs.saveTypeLabel') }}
          </UiFormLabel>
          <UiSelect
            :model-value="value"
            @update:model-value="(v) => handleChange(v === 'none' ? undefined : v)"
          >
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
                    ...Object.entries(abilityTypeMap).map(([_key, value]) => ({
                      label: value.charAt(0).toUpperCase() + value.slice(1),
                      value: value,
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
