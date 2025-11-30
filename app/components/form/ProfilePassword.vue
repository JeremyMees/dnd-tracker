<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

interface Data {
  password: string
}

const props = defineProps<{
  update: (data: Data) => Promise<void>
}>()

const { t } = useI18n()

const formSchemaData = toTypedSchema(z.object({
  password: z
    .string()
    .min(6)
    .max(50)
    .regex(containsLowercase, t('zod.containsLowercase'))
    .regex(containsUppercase, t('zod.containsUppercase'))
    .regex(containsNumber, t('zod.containsNumber'))
    .regex(containsSymbol, t('zod.containsSymbol'))
    .regex(allowedChars, t('zod.allowedChars')),
}))

const formData = useForm({
  validationSchema: formSchemaData,
})

const formError = ref<string>('')

const onSubmit = formData.handleSubmit(async (values) => {
  formError.value = ''

  try {
    await props.update(values)
  }
  catch (err: unknown) {
    formError.value = (err as Error)?.message || 'An error occurred during updating profile password'
  }
})
</script>

<template>
  <UiFormWrapper @submit="onSubmit">
    <FormPasswordToggle />
    <div
      v-if="formError"
      class="text-sm text-destructive"
    >
      {{ formError }}
    </div>
    <div class="flex justify-end">
      <UiButton type="submit">
        {{ $t('actions.save') }}
      </UiButton>
    </div>
  </UiFormWrapper>
</template>
