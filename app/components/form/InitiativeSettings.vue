<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { useForm } from 'vee-validate'

const emit = defineEmits<{ close: [] }>()

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const form = useForm({
  validationSchema: initiativeSettingsSchema,
  initialValues: initiativeSettingsInitialValues(sheet.value?.settings),
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async values => {
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
  } catch (err: any) {
    formError.value =
      err.message || 'An error occurred during updating initiative settings'
  }
})
</script>

<template>
  <div class="overflow-y-hidden">
    <UiFormWrapper @submit="onSubmit">
      <FormInitiativeSettingsFields />
      <div v-if="formError" class="text-sm text-destructive">
        {{ formError }}
      </div>
      <UiButton type="submit" class="w-full">
        {{ $t('actions.save') }}
      </UiButton>
    </UiFormWrapper>
  </div>
</template>
