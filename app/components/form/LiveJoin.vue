<script setup lang="ts">
import { useForm } from 'vee-validate'
import * as z from 'zod'

const props = defineProps<{
  code: string
  rows: LiveCodeSession['rows']
}>()

const emit = defineEmits<{
  joined: [session: LiveJoinResponse]
}>()

const { t } = useI18n()

const formSchema = z
  .object({
    name: z.string().trim().min(1).max(50),
    row: z.string().min(1).optional(),
    spectator: z.boolean().default(false),
  })
  .refine(data => data.spectator || !!data.row, {
    message: t('pages.live.errors.rowRequired'),
    path: ['row'],
  })

const form = useForm({
  validationSchema: formSchema,
  initialValues: { spectator: props.rows.length === 0 },
})

const formError = ref<string>('')
const isLoading = ref(false)

function errorMessage(statusCode: number): string {
  if (statusCode === 409) return t('pages.live.errors.rowClaimed')
  if (statusCode === 410) return t('pages.live.errors.expired')
  if (statusCode === 404) return t('pages.live.errors.notFound')
  return t('pages.live.errors.generic')
}

const onSubmit = form.handleSubmit(async values => {
  formError.value = ''
  isLoading.value = true

  try {
    const session = await $fetch<LiveJoinResponse>('/api/encounter/live/join', {
      method: 'POST',
      body: {
        code: props.code,
        name: values.name,
        row: values.spectator ? undefined : values.row,
        spectator: values.spectator,
      },
    })

    emit('joined', session)
  } catch (error) {
    formError.value = errorMessage(
      (error as { statusCode?: number })?.statusCode ?? 500,
    )
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <UiFormWrapper @submit="onSubmit">
    <UiFormField v-slot="{ componentField }" name="name">
      <UiFormItem v-auto-animate>
        <UiFormLabel required>
          {{ $t('pages.live.nameLabel') }}
        </UiFormLabel>
        <UiFormControl>
          <UiInput test-id="name" v-bind="componentField" />
        </UiFormControl>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>

    <UiFormField v-if="rows.length" v-slot="{ componentField }" name="row">
      <UiFormItem v-auto-animate>
        <UiFormLabel>{{ $t('pages.live.rowLabel') }}</UiFormLabel>
        <UiFormControl>
          <UiRadioGroup
            test-id="rows"
            :disabled="form.values.spectator"
            v-bind="componentField"
          >
            <UiFormItem
              v-for="row in rows"
              :key="row.id"
              class="flex items-center space-y-0 gap-x-3"
            >
              <UiFormControl>
                <UiRadioGroupItem :test-id="`row-${row.id}`" :value="row.id" />
              </UiFormControl>
              <UiFormLabel class="font-normal">{{ row.name }}</UiFormLabel>
            </UiFormItem>
          </UiRadioGroup>
        </UiFormControl>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>

    <UiFormField v-slot="{ value, handleChange }" name="spectator">
      <UiFormItem
        v-auto-animate
        class="flex items-center justify-between gap-2"
      >
        <UiFormLabel class="font-normal">
          {{ $t('pages.live.spectatorLabel') }}
        </UiFormLabel>
        <UiFormControl>
          <UiSwitch
            test-id="spectator"
            :model-value="value"
            @update:model-value="handleChange"
          />
        </UiFormControl>
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
      {{ $t('actions.join') }}
    </UiButton>
  </UiFormWrapper>
</template>
