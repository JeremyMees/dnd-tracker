<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { useEncounterCreate, useEncounterUpdate } from '~/queries/encounters'
import { useCampaignMinimalListing } from '~/queries/campaigns'
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

const formSchema = z
  .object({
    title: z.string().min(3).max(30),
    campaign: z
      .union([z.number(), z.literal('none')])
      .optional()
      .transform(val => (val === 'none' ? null : val)),
  })
  .extend(initiativeSettingsSchema.shape)

const existingSettings = props.encounter?.settings
const isModified = existingSettings?.modified ?? false
const showSettings = ref(isModified)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    title: props.encounter?.title || '',
    campaign: props.encounter?.campaign?.id || undefined,
    ...initiativeSettingsInitialValues(existingSettings),
  },
})

const formError = ref<string>('')

const { mutateAsync: updateEncounter } = useEncounterUpdate()
const { mutateAsync: addEncounter } = useEncounterCreate()
const { data: campaigns, isError } = useCampaignMinimalListing(user.value.id)

watch(isError, err => {
  if (err) {
    toast({
      title: t('general.error.title'),
      description: t('general.error.text'),
      variant: 'destructive',
    })

    emit('close')
  }
})

const onSubmit = form.handleSubmit(async values => {
  formError.value = ''

  const onSuccess = () => emit('close')
  const onError = (error: string) => (formError.value = error)

  const { title, campaign, ...settingsValues } = values

  const data = {
    title,
    campaign: props.campaignId ?? campaign,
    settings: {
      ...settingsValues,
      modified: true,
    } satisfies InitiativeSettings,
  }

  if (props.encounter) {
    await updateEncounter({
      data,
      id: props.encounter.id,
      onSuccess,
      onError,
    })
  } else {
    await addEncounter({
      data: { ...data, rows: [] },
      onSuccess,
      onError,
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
    <UiFormField v-if="!campaignId" v-slot="{ componentField }" name="campaign">
      <UiFormItem test-id="campaign">
        <UiFormLabel>{{ $t('components.inputs.campaignLabel') }}</UiFormLabel>
        <UiSelect v-bind="componentField" :disabled="!campaigns">
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
                  ...(campaigns?.map(c => ({ label: c.title, value: c.id })) ||
                    []),
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
    <UiButton
      test-id="settings-toggle"
      type="button"
      variant="secondary"
      class="w-full justify-between"
      :aria-expanded="showSettings"
      @click="showSettings = !showSettings"
    >
      {{ $t('general.setting', 2) }}
      <Icon
        name="tabler:chevron-down"
        class="transition-transform duration-200"
        :class="{ 'rotate-180': showSettings }"
        aria-hidden="true"
      />
    </UiButton>
    <AnimationExpand>
      <div
        v-show="showSettings"
        test-id="settings"
        class="space-y-4 border rounded-lg p-4"
      >
        <FormInitiativeSettingsFields />
      </div>
    </AnimationExpand>
    <div v-if="formError" test-id="error" class="text-sm text-destructive">
      {{ formError }}
    </div>
    <UiButton test-id="submit" type="submit" class="w-full">
      {{
        encounter ? $t('pages.encounters.update') : $t('pages.encounters.add')
      }}
    </UiButton>
  </UiFormWrapper>
</template>
