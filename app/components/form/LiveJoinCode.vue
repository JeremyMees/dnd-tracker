<script setup lang="ts">
import { useForm } from 'vee-validate'
import * as z from 'zod'

const props = defineProps<{
  initialCode?: string
  initialErrorStatus?: number
}>()

const emit = defineEmits<{
  validated: [session: LiveCodeSession]
}>()

const { t } = useI18n()

const formSchema = z.object({
  code: z.string().trim().length(6),
})

const form = useForm({
  validationSchema: formSchema,
  initialValues: { code: props.initialCode ?? '' },
})

const formError = ref<string>('')
const isLoading = ref(false)

function errorMessage(statusCode: number): string {
  if (statusCode === 410) return t('pages.live.errors.expired')
  if (statusCode === 404) return t('pages.live.errors.notFound')
  return t('pages.live.errors.generic')
}

const onSubmit = form.handleSubmit(async values => {
  formError.value = ''
  isLoading.value = true

  try {
    const session = await $fetch<LiveCodeSession>('/api/live/code', {
      query: { code: values.code.toUpperCase() },
    })

    emit('validated', session)
  } catch (error) {
    formError.value = errorMessage(
      (error as { statusCode?: number })?.statusCode ?? 500,
    )
  } finally {
    isLoading.value = false
  }
})

onMounted(async () => {
  if (props.initialErrorStatus) {
    formError.value = errorMessage(props.initialErrorStatus)
  } else if (props.initialCode) {
    await nextTick()
    onSubmit()
  }
})
</script>

<template>
  <UiFormWrapper @submit="onSubmit">
    <UiFormField v-slot="{ componentField }" name="code">
      <UiFormItem v-auto-animate>
        <UiFormLabel required>
          {{ $t('pages.live.codeLabel') }}
        </UiFormLabel>
        <UiFormControl>
          <UiInput
            test-id="code"
            maxlength="6"
            class="text-center uppercase tracking-widest"
            v-bind="componentField"
          />
        </UiFormControl>
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
      :disabled="isLoading"
    >
      {{ $t('pages.live.join') }}
    </UiButton>
  </UiFormWrapper>
</template>
