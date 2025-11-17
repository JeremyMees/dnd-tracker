<script lang="ts" setup>
import { useCampaignUpdate } from '~~/queries/campaigns'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const props = defineProps<{
  current?: CampaignFull
  campaignId: number
}>()

const { mutateAsync: updateCampaign } = useCampaignUpdate()

const formSchema = toTypedSchema(z.object({
  title: z.string().min(3).max(30),
}))

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    title: props.current?.title || '',
  },
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  await updateCampaign({
    data: values,
    id: props.campaignId,
    onError: error => formError.value = error,
  })
})
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
            type="text"
            v-bind="componentField"
          />
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
    <div class="flex justify-end">
      <UiButton type="submit">
        {{ $t('pages.campaigns.update') }}
      </UiButton>
    </div>
  </UiFormWrapper>
</template>
