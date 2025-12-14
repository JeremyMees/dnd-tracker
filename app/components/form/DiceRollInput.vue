<script setup lang="ts">
const isRollingShown = shallowRef(false)
</script>

<template>
  <UiFormField
    v-slot="{ componentField, setValue }"
    name="amount"
  >
    <UiFormItem v-auto-animate>
      <UiFormLabel required>
        {{ $t('components.inputs.amountLabel') }}
      </UiFormLabel>
      <UiFormControl>
        <UiInputGroup>
          <UiInputGroupInput
            type="number"
            v-bind="componentField"
          />
          <UiInputGroupAddon align="inline-end">
            <UiInputGroupButton
              :aria-label="isRollingShown ? $t('components.inputs.hideDiceRoller') : $t('components.inputs.showDiceRoller')"
              @click="isRollingShown = !isRollingShown"
            >
              <Icon :name="!!isRollingShown ? 'tabler:x' : 'tabler:hexagon'" />
            </UiInputGroupButton>
          </UiInputGroupAddon>
        </UiInputGroup>
      </UiFormControl>
      <DiceRoller
        v-if="isRollingShown"
        data-test-roller
        @rolled="setValue($event), isRollingShown = false"
      />
      <UiFormMessage />
    </UiFormItem>
  </UiFormField>
</template>
