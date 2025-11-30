<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

interface Data {
  name: string
  username: string
  email: string
  marketing: boolean
}

const props = defineProps<{
  update: (data: Data) => Promise<void>
  initialValues: Data
}>()

const { t } = useI18n()

const formSchemaData = toTypedSchema(z.object({
  name: z.string().min(3).max(30).regex(alphaSpaces, t('zod.alphaSpaces')),
  username: z.string().min(5).max(50).regex(alphaSpaces, t('zod.alphaSpaces')),
  email: z.string().min(5).max(50).email(),
  marketing: z.boolean(),
}))

const formData = useForm({
  validationSchema: formSchemaData,
  initialValues: props.initialValues,
})

const formError = ref<string>('')

const onSubmit = formData.handleSubmit(async (values) => {
  formError.value = ''

  try {
    await props.update(values)
  }
  catch (err: unknown) {
    formError.value = (err as Error)?.message || 'An error occurred during updating profile data'
  }
})
</script>

<template>
  <UiFormWrapper @submit="onSubmit">
    <UiFormField
      v-slot="{ componentField }"
      name="name"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel required>
          {{ $t('components.inputs.fullNameLabel') }}
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
      name="username"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel required>
          {{ $t('components.inputs.usernameLabel') }}
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
      name="email"
    >
      <UiFormItem>
        <UiFormLabel required>
          {{ $t('components.inputs.emailLabel') }}
        </UiFormLabel>
        <UiFormControl>
          <UiInput
            type="email"
            v-bind="componentField"
          />
        </UiFormControl>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
    <UiFormField
      v-slot="{ value, handleChange }"
      name="marketing"
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
          {{ $t('components.inputs.marketingLabel') }}
        </UiFormLabel>
      </UiFormItem>
    </UiFormField>
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
