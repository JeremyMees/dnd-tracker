<script setup lang="ts">
import { useFeatureCreate } from '~~/queries/features'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const emit = defineEmits<{ close: [] }>()

const { user } = useAuthentication()
const { t } = useI18n()

const { mutateAsync: create } = useFeatureCreate()

const baseSchema = z.object({
  title: z.string().min(3).max(50),
  text: z.string().min(10).max(500),
})

const form = useForm({
  validationSchema: toTypedSchema(baseSchema),
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  await create({
    data: {
      ...values,
      created_by: user.value!.id,
      voted: {
        like: [user.value!.id],
        dislike: [],
      },
    },
    onSuccess: async () => {
      await sendFeatureEmail(values)

      emit('close')
    },
    onError: error => formError.value = error,
  })
})

async function sendFeatureEmail(form: z.infer<typeof baseSchema>): Promise<void> {
  if (!user.value) return

  const { error } = await useFetch('/api/emails/feature-request', {
    method: 'POST',
    body: {
      ...form,
      name: user.value.username,
      email: user.value.email,
    },
  })

  if (error.value) throw createError(t('general.mail.fail.text'))
}
</script>

<template>
  <UiFormWrapper @submit="onSubmit">
    <UiFormField
      v-slot="{ componentField }"
      name="title"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel required>
          {{ $t('components.inputs.titleLabel') }}
        </UiFormLabel>
        <UiFormControl>
          <UiInput
            v-bind="componentField"
            type="text"
          />
        </UiFormControl>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
    <UiFormField
      v-slot="{ componentField }"
      name="text"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel required>
          {{ $t('components.inputs.descriptionLabel') }}
        </UiFormLabel>
        <UiFormControl>
          <UiTextarea v-bind="componentField" />
        </UiFormControl>
        <UiFormMessage />
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
      {{ $t('actions.create') }}
    </UiButton>
  </UiFormWrapper>
</template>
