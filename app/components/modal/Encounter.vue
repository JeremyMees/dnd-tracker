<script setup lang="ts">
import { reset } from '@formkit/core'
import { useToast } from '~/components/ui/toast/use-toast'
import { useEncounterCreate, useEncounterUpdate } from '~~/queries/encounters'
import { useCampaignMinimalListing } from '~~/queries/campaigns'

const emit = defineEmits<{ close: [] }>()

const props = defineProps<{
  encounter?: EncounterItem
  campaignId?: number
}>()

const user = useAuthenticatedUser()
const { toast } = useToast()
const { t } = useI18n()

const input = ref()

const { mutateAsync: updateEncounter } = useEncounterUpdate()
const { mutateAsync: addEncounter } = useEncounterCreate()
const { data: campaigns, isError } = useCampaignMinimalListing(user.value.id)

onMounted(() => {
  if (input.value) focusInput(input.value)
})

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

interface EncounterForm { title: string, campaign?: number }

async function handleSubmit(form: EncounterForm, node: FormNode): Promise<void> {
  node.clearErrors()

  const onSuccess = () => emit('close')

  const onError = (error: string) => {
    reset('Encounter')
    node.setErrors(error)
  }

  const formData = sanitizeForm<EncounterForm>(form)

  if (props.campaignId) formData.campaign = props.campaignId

  if (props.encounter) {
    await updateEncounter({
      data: formData,
      id: props.encounter.id,
      onSuccess,
      onError,
    })
  }
  else {
    await addEncounter({
      data: { ...formData, rows: [] },
      onSuccess,
      onError,
    })
  }
}
</script>

<template>
  <FormKit
    id="Encounter"
    type="form"
    :actions="false"
    @submit="handleSubmit"
  >
    <FormKit
      ref="input"
      name="title"
      :label="$t('components.inputs.titleLabel')"
      :value="encounter?.title"
      validation="required|length:3,30"
    />
    <FormKit
      v-if="!campaignId"
      name="campaign"
      type="select"
      :label="$t('components.inputs.campaignLabel')"
      :placeholder="$t('general.noSelected')"
      :disabled="!campaigns"
      :value="encounter?.campaign?.id"
      :options="campaigns?.map(c => ({ label: c.title, value: c.id })) || []"
      outer-class="$remove:mb-4"
    />
  </FormKit>
</template>
