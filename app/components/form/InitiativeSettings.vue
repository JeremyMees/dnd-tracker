<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { useForm } from 'vee-validate'

const emit = defineEmits<{ close: [] }>()

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const form = useForm({
  validationSchema: initiativeSettingsSchema,
  initialValues: initiativeSettingsInitialValues(sheet.value?.settings),
})

const onSubmit = form.handleSubmit(async values => {
  if (!sheet.value) return

  try {
    await update({
      settings: {
        ...sheet.value.settings,
        ...values,
        modified: true,
      },
    })
  } catch {
    return
  }

  emit('close')
})
</script>

<template>
  <div class="overflow-y-hidden">
    <UiFormWrapper @submit="onSubmit">
      <FormInitiativeSettingsFields />
      <UiButton type="submit" class="w-full">
        {{ $t('actions.save') }}
      </UiButton>
    </UiFormWrapper>
  </div>
</template>
