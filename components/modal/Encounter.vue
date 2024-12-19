<script setup lang="ts">
import { reset } from '@formkit/core'

const emit = defineEmits<{
  close: []
  finished: []
}>()

const props = defineProps<{
  encounter?: EncounterItem
  campaignId?: number
}>()

const store = useEncounters()
const campaign = useCampaigns()
const profile = useProfile()
const toast = useToast()

const input = ref()
const campaigns = ref<CampaignMinimal[]>()

onMounted(() => {
  if (input.value) focusInput(input.value)
  fetchCampaigns()
})

async function fetchCampaigns(): Promise<void> {
  try {
    const id = profile.user!.id
    const data = await campaign.getCampaignsMinimal()

    campaigns.value = data.filter((campaign) => {
      if (
        campaign.created_by.id === id
        || campaign.team.find(u => u.user.id === id && u.role !== 'Viewer')
      ) return true
    })
  }
  catch (err: any) {
    toast.error()

    emit('close')
  }
}

async function handleSubmit(form: EncounterForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    const formData = sanitizeForm<EncounterForm>(form)

    if (props.campaignId) formData.campaign = props.campaignId

    if (props.encounter) await updateEncounter(formData)
    else await addEncounter(formData)

    emit('finished')
    emit('close')
  }
  catch (err: any) {
    reset('form')
    node.setErrors(err.message)
  }
}

async function addEncounter(data: EncounterForm): Promise<void> {
  if (profile.user) {
    await store.addEncounter(data)
  }
}

async function updateEncounter(data: EncounterForm): Promise<void> {
  if (props.encounter) {
    await store.updateEncounter(data, props.encounter.id)
  }
}
</script>

<template>
  <FormKit
    id="form"
    type="form"
    :submit-label="$t(`pages.encounters.${encounter ? 'update' : 'add'}`)"
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
    />
  </FormKit>
</template>
