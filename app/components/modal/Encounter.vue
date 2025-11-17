<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { useEncounterCreate, useEncounterUpdate } from '~~/queries/encounters'
import { useCampaignMinimalListing } from '~~/queries/campaigns'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const emit = defineEmits<{ close: [] }>()

const props = defineProps<{
  encounter?: EncounterItem
  campaignId?: number
}>()

const user = useAuthenticatedUser()
const { toast } = useToast()
const { t } = useI18n()

const formSchema = toTypedSchema(z.object({
  title: z.string().min(3).max(30),
  campaign: z.union([z.number(), z.literal('none')]).optional().transform(val => val === 'none' ? null : val),
}))

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    title: props.encounter?.title || '',
    campaign: props.encounter?.campaign?.id || undefined,
  },
})

const formError = ref<string>('')

const { mutateAsync: updateEncounter } = useEncounterUpdate()
const { mutateAsync: addEncounter } = useEncounterCreate()
const { data: campaigns, isError } = useCampaignMinimalListing(user.value.id)

watch(isError, (err) => {
  if (err) {
    toast({
      title: t('general.error.title'),
      description: t('general.error.text'),
      variant: 'destructive',
    })

    emit('close')
  }
})

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  const onSuccess = () => emit('close')
  const onError = (error: string) => formError.value = error

  if (props.campaignId) values.campaign = props.campaignId

  if (props.encounter) {
    await updateEncounter({
      data: values,
      id: props.encounter.id,
      onSuccess,
      onError,
    })
  }
  else {
    await addEncounter({
      data: { ...values, rows: [] },
      onSuccess,
      onError,
    })
  }
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
    <UiFormField
      v-if="!campaignId"
      v-slot="{ componentField }"
      name="campaign"
    >
      <UiFormItem>
        <UiFormLabel>{{ $t('components.inputs.campaignLabel') }}</UiFormLabel>
        <UiSelect
          v-bind="componentField"
          :disabled="!campaigns"
        >
          <UiFormControl>
            <UiSelectTrigger>
              <UiSelectValue :placeholder="$t('general.noSelected')" />
            </UiSelectTrigger>
          </UiFormControl>
          <UiSelectContent>
            <UiSelectGroup>
              <UiSelectItem
                v-for="option in [
                  { label: $t('components.inputs.noCampaign'), value: 'none' },
                  ...(campaigns?.map(c => ({ label: c.title, value: c.id })) || []),
                ]"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </UiSelectItem>
            </UiSelectGroup>
          </UiSelectContent>
        </UiSelect>
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
      {{ encounter ? $t('pages.encounters.update') : $t('pages.encounters.add') }}
    </UiButton>
  </UiFormWrapper>
</template>
