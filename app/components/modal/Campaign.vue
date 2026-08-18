<script setup lang="ts">
import { useCampaignCreate, useCampaignUpdate } from '~/queries/campaigns'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const emit = defineEmits<{ close: [] }>()

const props = defineProps<{ campaign?: CampaignItem | CampaignRow }>()

const user = useAuthenticatedUser()
const { mutateAsync: createCampaign } = useCampaignCreate()
const { mutateAsync: updateCampaign } = useCampaignUpdate()

const formSchema = z.object({
  title: z.string().min(3).max(30),
})

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    title: props.campaign?.title || '',
  },
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async values => {
  formError.value = ''

  const onSuccess = () => emit('close')
  const onError = (error: string) => (formError.value = error)

  if (props.campaign) {
    await updateCampaign({
      data: values,
      id: props.campaign.id,
      onError,
      onSuccess,
    })
  } else {
    await createCampaign({
      data: { ...values, createdBy: user.value.id },
      onError,
      onSuccess,
    })
  }
})
</script>

<template>
  <UiFormWrapper @submit="onSubmit">
    <UiFormField v-slot="{ componentField }" name="title">
      <UiFormItem v-auto-animate>
        <UiFormLabel required>
          {{ $t('components.inputs.titleLabel') }}
        </UiFormLabel>
        <UiFormControl>
          <UiInput test-id="title" type="text" v-bind="componentField" />
        </UiFormControl>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
    <div v-if="formError" test-id="error" class="text-sm text-destructive">
      {{ formError }}
    </div>
    <UiButton test-id="submit" type="submit" class="w-full">
      {{ campaign ? $t('pages.campaigns.update') : $t('pages.campaigns.add') }}
    </UiButton>
  </UiFormWrapper>
</template>
