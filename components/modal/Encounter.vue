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
const { t } = useI18n()

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
        campaign.created_by === id
        || campaign.team.find(u => u.user === id && u.role !== 'Viewer')
      ) return true
    })
  }
  catch (err: any) {
    toast.error()

    emit('close')
  }
}

// const campaignOptions = computed<Option[]>(() => {
//   if (campaigns.campaigns) {
//     return campaigns.campaigns.map((c: Campaign) => {
//       return { label: c.title, value: c.id }
//     })
//   }
//   else {
//     return []
//   }
// })

// onMounted(() => {
//   if (!props.campaignId) {
//     campaigns.fetch()
//   }
// })

// watch(() => campaigns.campaigns, (v) => {
//   campaign.value = !!v?.length || false
// }, { immediate: true })

// set the values from campaign when in update mode
// whenever(() => props.update, () => {
//   const camp = props.encounter?.campaign?.id

//   form.value.title = props.encounter?.title || ''
//   form.value.campaign = props.campaignId || camp
// })

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
    :submit-label="t(`pages.encounters.${encounter ? 'update' : 'add'}`)"
    @submit="handleSubmit"
  >
    <FormKit
      ref="input"
      name="title"
      :label="t('components.inputs.titleLabel')"
      validation="required|length:3,30"
    />
    <FormKit
      v-if="!campaignId"
      name="campaign"
      type="select"
      :label="t('components.inputs.campaignLabel')"
      :placeholder="t('general.noSelected')"
      :disabled="!campaigns"
      :value="encounter?.campaign?.id"
      :options="campaigns?.map(c => ({ label: c.title, value: c.id })) || []"
    />
  </FormKit>
</template>
