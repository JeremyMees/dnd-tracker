<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

useSeo('Contact')

const { t } = useI18n()
const { toast } = useToast()
const localePath = useLocalePath()

const formSchema = toTypedSchema(z.object({
  name: z.string().min(3).max(30).regex(alphaSpaces, t('zod.alphaSpaces')).optional(),
  email: z.string().min(5).max(50).email(),
  question: z.string().min(3).max(1000),
}))

const form = useForm({
  validationSchema: formSchema,
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  try {
    const { error } = await useFetch('/api/emails/contact-request', {
      method: 'POST',
      body: values,
    })

    if (error.value) throw createError(error.value)

    toast({
      description: t('pages.contact.success'),
      variant: 'success',
    })

    navigateTo(localePath('/'))
  }
  catch (err: any) {
    formError.value = err.message || 'An error occurred during contact request'

    toast({
      description: t('general.mail.fail.text'),
      title: t('general.mail.fail.title'),
      variant: 'destructive',
    })
  }
})
</script>

<template>
  <NuxtLayout name="centered">
    <template #header>
      <h1 class="head-3">
        {{ $t('pages.contact.title') }}
      </h1>
    </template>

    <UiFormWrapper @submit="onSubmit">
      <UiFormField
        v-slot="{ componentField }"
        name="name"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>
            {{ $t('components.inputs.nameLabel') }}
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
        <UiFormItem v-auto-animate>
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
        v-slot="{ componentField }"
        name="question"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel required>
            {{ $t('components.inputs.questionLabel') }}
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
        {{ $t('pages.contact.send') }}
      </UiButton>
    </UiFormWrapper>
  </NuxtLayout>
</template>
