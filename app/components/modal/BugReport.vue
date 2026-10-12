<script setup lang="ts">
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { useToast } from '~/components/ui/toast'
import {
  bugReportScreenshotTypes,
  maxBugReportScreenshotSize,
} from '~~/constants/validation'

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const { toast } = useToast()
const { user } = useAuthentication()

const schema = z.object({
  message: z.string().min(10).max(1000),
  email: z.email().or(z.literal('')).optional(),
  screenshot: z
    .file()
    .mime(bugReportScreenshotTypes, {
      error: () => t('components.bugReportModal.errors.screenshotType'),
    })
    .max(maxBugReportScreenshotSize, {
      error: () => t('components.bugReportModal.errors.screenshotSize'),
    })
    .optional(),
})

const { handleSubmit, isSubmitting } = useForm({ validationSchema: schema })

const formError = ref<string>('')

const onSubmit = handleSubmit(async values => {
  formError.value = ''

  try {
    await sendBugReport({
      message: values.message,
      name: user.value?.username,
      email: user.value?.email ?? (values.email || undefined),
      screenshot: values.screenshot,
    })

    toast({
      title: t('components.bugReportModal.success.title'),
      description: t('components.bugReportModal.success.text'),
      variant: 'success',
    })

    emit('close')
  } catch {
    formError.value = t('components.bugReportModal.errors.send')
  }
})
</script>

<template>
  <UiFormWrapper @submit="onSubmit">
    <UiFormField v-slot="{ componentField }" name="message">
      <UiFormItem v-auto-animate>
        <UiFormLabel required>
          {{ $t('components.bugReportModal.message') }}
        </UiFormLabel>
        <UiFormControl>
          <UiTextarea
            test-id="message"
            v-bind="componentField"
            :placeholder="$t('components.bugReportModal.messagePlaceholder')"
          />
        </UiFormControl>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
    <UiFormField v-if="!user" v-slot="{ componentField }" name="email">
      <UiFormItem v-auto-animate>
        <UiFormLabel>
          {{ $t('components.inputs.emailLabel') }}
        </UiFormLabel>
        <UiFormControl>
          <UiInput test-id="email" v-bind="componentField" type="email" />
        </UiFormControl>
        <UiFormDescription>
          {{ $t('components.bugReportModal.emailDescription') }}
        </UiFormDescription>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
    <UiFormField v-slot="{ componentField }" name="screenshot">
      <UiFormItem v-auto-animate>
        <UiFormLabel>
          {{ $t('components.bugReportModal.screenshot') }}
        </UiFormLabel>
        <UiFormControl>
          <UiFileInput
            test-id="screenshot"
            v-bind="componentField"
            :accept="bugReportScreenshotTypes.join(',')"
          />
        </UiFormControl>
        <UiFormDescription>
          {{ $t('components.bugReportModal.screenshotDescription') }}
        </UiFormDescription>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
    <div v-if="formError" test-id="error" class="text-sm text-destructive">
      {{ formError }}
    </div>
    <UiButton
      test-id="submit"
      type="submit"
      class="w-full"
      :disabled="isSubmitting"
    >
      {{ $t('components.bugReportModal.send') }}
    </UiButton>
  </UiFormWrapper>
</template>
