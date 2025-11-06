<script setup lang="ts">
defineProps<{ noLabel?: boolean }>()
</script>

<template>
  <UiFormField name="widgets">
    <UiFormItem>
      <UiFormLabel
        v-if="!noLabel"
        class="text-base"
      >
        {{ $t('components.initiativeSettings.widgets') }}
      </UiFormLabel>
      <UiFormField
        v-for="widget in [
          { label: $t('general.note'), value: 'note' },
          { label: $t('general.infoPins'), value: 'info-pins' },
        ]"
        v-slot="{ value, handleChange }"
        :key="widget.value"
        type="checkbox"
        :value="widget.value"
        :unchecked-value="false"
        name="widgets"
      >
        <UiFormItem class="flex flex-row items-center space-x-2 space-y-0">
          <UiFormControl>
            <UiCheckbox
              :model-value="value.includes(widget.value)"
              @update:model-value="handleChange"
            />
          </UiFormControl>
          <UiFormLabel>
            {{ widget.label }}
          </UiFormLabel>
        </UiFormItem>
      </UiFormField>
      <UiFormMessage />
    </UiFormItem>
  </UiFormField>
</template>
