<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import {
  initiativeSpacingOptions,
  initiativeDefaultRows,
  initiativePets,
  initiativeWidgets,
} from '~~/constants/validation'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const emit = defineEmits<{ close: [] }>()

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const isModified = computed(() => sheet.value?.settings?.modified ?? false)

const formSchema = toTypedSchema(z.object({
  spacing: z.enum(initiativeSpacingOptions),
  rows: z.array(z.enum(initiativeDefaultRows)),
  widgets: z.array(z.enum(initiativeWidgets)),
  pet: z.union([z.enum(initiativePets), z.literal('none')]).optional().transform(val => val === 'none' ? undefined : val),
  negative: z.boolean(),
}))

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    spacing: sheet.value?.settings?.spacing || 'normal',
    rows: isModified.value
      ? (sheet.value?.settings?.rows || [])
      : [...initiativeDefaultRows],
    widgets: isModified.value
      ? (sheet.value?.settings?.widgets || [])
      : [...initiativeWidgets],
    pet: sheet.value?.settings?.pet || undefined,
    negative: sheet.value?.settings?.negative || false,
  },
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async (values) => {
  if (!sheet.value) return

  formError.value = ''

  try {
    await update({
      settings: {
        ...values,
        modified: true,
      },
    })

    emit('close')
  }
  catch (err: any) {
    formError.value = err.message || 'An error occurred during updating initiative settings'
  }
})
</script>

<template>
  <div class="overflow-y-hidden">
    <UiFormWrapper @submit="onSubmit">
      <UiFormField
        v-slot="{ componentField }"
        type="radio"
        name="spacing"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>{{ $t('components.initiativeSettings.spacing') }}</UiFormLabel>
          <UiFormControl>
            <UiRadioGroup
              class="sm:grid-cols-3 rounded-md border border-input bg-background px-3 py-2"
              v-bind="componentField"
            >
              <UiFormItem
                v-for="option in [
                  { label: 'Compact', value: 'compact' },
                  { label: 'Normal', value: 'normal' },
                  { label: 'Cozy', value: 'cozy' },
                ]"
                :key="option.value"
                class="flex items-center space-y-0 gap-x-3"
              >
                <UiFormControl>
                  <UiRadioGroupItem :value="option.value" />
                </UiFormControl>
                <UiFormLabel class="font-normal">
                  {{ option.label }}
                </UiFormLabel>
              </UiFormItem>
            </UiRadioGroup>
          </UiFormControl>
          <UiFormMessage />
        </UiFormItem>
      </UiFormField>
      <FormCheckboxGroup
        name="rows"
        :label="$t('components.initiativeSettings.rows')"
        :options="[
          { label: 'AC', value: 'ac' },
          { label: 'HP', value: 'health' },
          { label: $t('general.condition', 2), value: 'conditions' },
          { label: $t('general.note'), value: 'note' },
          { label: 'Death saves', value: 'deathSaves' },
          { label: $t('general.concentration'), value: 'concentration' },
          { label: $t('general.modify'), value: 'modify' },
        ]"
        list-class="sm:grid-cols-2 rounded-md border border-input bg-background px-3 py-2"
      />
      <FormCheckboxGroup
        name="widgets"
        :label="$t('components.initiativeSettings.widgets')"
        :options="[
          { label: $t('general.note'), value: 'note' },
          { label: $t('general.infoPins'), value: 'info-pins' },
        ]"
        list-class="sm:grid-cols-2 rounded-md border border-input bg-background px-3 py-2"
      />
      <UiFormField
        v-slot="{ componentField }"
        name="pet"
      >
        <UiFormItem>
          <UiFormLabel>{{ $t('components.initiativeSettings.pets.label') }}</UiFormLabel>
          <UiSelect v-bind="componentField">
            <UiFormControl>
              <UiSelectTrigger>
                <UiSelectValue />
              </UiSelectTrigger>
            </UiFormControl>
            <UiSelectContent>
              <UiSelectGroup>
                <UiSelectItem
                  v-for="option in [
                    { label: $t('general.none'), value: 'none' },
                    { label: $t('components.initiativeSettings.pets.cat'), value: 'cat' },
                    { label: $t('components.initiativeSettings.pets.chicken'), value: 'chicken' },
                    { label: $t('components.initiativeSettings.pets.barmaid'), value: 'barmaid' },
                    { label: $t('components.initiativeSettings.pets.crawler'), value: 'crawler' },
                    { label: $t('components.initiativeSettings.pets.dragon'), value: 'dragon' },
                    { label: $t('components.initiativeSettings.pets.fairy'), value: 'fairy' },
                    { label: $t('components.initiativeSettings.pets.redcap'), value: 'redcap' },
                    { label: $t('components.initiativeSettings.pets.wolf-rider'), value: 'wolf-rider' },
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
      <UiFormField
        v-slot="{ value, handleChange }"
        name="negative"
      >
        <UiFormItem class="flex items-center gap-2">
          <UiFormControl>
            <UiSwitch
              class="mb-0"
              :model-value="value"
              @update:model-value="handleChange"
            />
          </UiFormControl>
          <UiFormLabel>
            {{ $t('components.initiativeSettings.negative') }}
          </UiFormLabel>
        </UiFormItem>
      </UiFormField>
      <div
        v-if="formError"
        class="text-sm text-destructive"
      >
        {{ formError }}
      </div>
      <UiButton
        type="submit"
        class="w-full"
      >
        {{ $t('actions.save') }}
      </UiButton>
    </UiFormWrapper>
  </div>
</template>
