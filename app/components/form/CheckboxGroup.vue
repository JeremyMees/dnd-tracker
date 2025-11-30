<script setup lang="ts">
defineProps<{
  name: string
  options: Option<string>[]
  label?: string
  listClass?: string
}>()
</script>

<template>
  <UiFormField :name="name">
    <UiFormItem>
      <UiFormLabel v-if="label">
        {{ label }}
      </UiFormLabel>
      <div
        :class="cn('grid gap-1', listClass)"
      >
        <UiFormField
          v-for="option in options"
          v-slot="{ value, handleChange }"
          :key="option.value"
          type="checkbox"
          :value="option.value"
          :unchecked-value="false"
          :name="name"
        >
          <UiFormItem class="flex flex-row items-center space-x-2 space-y-0">
            <UiFormControl>
              <UiCheckbox
                :model-value="value.includes(option.value)"
                @update:model-value="handleChange"
              />
            </UiFormControl>
            <UiFormLabel>
              {{ option.label }}
            </UiFormLabel>
          </UiFormItem>
        </UiFormField>
      </div>
      <UiFormMessage />
    </UiFormItem>
  </UiFormField>
</template>
