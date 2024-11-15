<script setup lang="ts">
import { reset } from '@formkit/core'

const emit = defineEmits<{
  close: []
  finished: []
}>()

const props = defineProps<{ campaign?: CampaignItem | CampaignRow }>()

const store = useCampaigns()
const profile = useProfile()
const { t } = useI18n()

const input = ref()

onMounted(() => input.value && focusInput(input.value))

async function handleSubmit(form: CampaignForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    const formData = sanitizeForm<CampaignForm>(form)

    if (props.campaign) await updateCampaign(formData)
    else await addCampaign(formData)

    emit('finished')
    emit('close')
  }
  catch (err: any) {
    reset('form')
    node.setErrors(err.message)
  }
}

async function addCampaign(data: CampaignForm): Promise<void> {
  if (profile.user) {
    await store.addCampaign({
      ...data,
      created_by: profile.user.id,
    })
  }
}

async function updateCampaign(data: CampaignForm): Promise<void> {
  if (props.campaign) {
    await store.updateCampaign(data, props.campaign.id)
  }
}
</script>

<template>
  <FormKit
    id="form"
    type="form"
    :submit-label="t(`pages.campaigns.${campaign ? 'update' : 'add'}`)"
    @submit="handleSubmit"
  >
    <FormKit
      ref="input"
      name="title"
      :label="t('components.inputs.titleLabel')"
      :value="campaign?.title ? campaign.title : ''"
      validation="required|length:3,30"
    />
  </FormKit>
</template>
