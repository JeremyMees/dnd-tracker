<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { useForm } from 'vee-validate'

const emit = defineEmits<{ close: [] }>()

const { sheet, updateSheet } = validateInject(INITIATIVE_SHEET)

const form = useForm({
  validationSchema: initiativeSettingsSchema,
  initialValues: initiativeSettingsInitialValues(sheet.value?.settings),
})

const onSubmit = form.handleSubmit(async values => {
  if (!sheet.value) return

  try {
    await updateSheet({
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
  <UiFormWrapper
    class="flex min-h-0 flex-col gap-4 space-y-0"
    @submit="onSubmit"
  >
    <UiDialogBody class="space-y-4">
      <FormInitiativeSettingsFields />
    </UiDialogBody>
    <UiDialogFooter>
      <UiButton type="submit" class="w-full">
        {{ $t('actions.save') }}
      </UiButton>
    </UiDialogFooter>
  </UiFormWrapper>
</template>
