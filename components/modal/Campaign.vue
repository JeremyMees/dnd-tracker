<script setup lang="ts">
import { reset } from '@formkit/core'

const emit = defineEmits<{ close: [] }>()

const props = withDefaults(
  defineProps<{
    campaign?: CampaignItem | CampaignRow
    update?: boolean
  }>(), {
    update: false,
    campaign: undefined,
  },
)

const store = useCampaigns()
const profile = useProfile()
const { t } = useI18n()

const input = ref()

onMounted(() => input.value && focusInput(input.value))

// if (props.update) {
//   form.value.title = props.campaign?.title || ''
// }

function handleSubmit(form: CampaignForm, node: FormNode): void {
  node.clearErrors()

  try {
    const formData = sanitizeForm<CampaignForm>(form)

    if (props.update) updateCampaign(formData)
    else addCampaign(formData)

    emit('close')
  }
  catch (err: any) {
    node.setErrors(err.message)
    reset('form')
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
    :submit-label="t(`pages.campaigns.${update ? 'update' : 'add'}`)"
    @submit="handleSubmit"
  >
    <FormKit
      ref="input"
      name="title"
      :label="t('components.inputs.titleLabel')"
      :value="update && campaign?.title ? campaign.title : ''"
      validation="required|length:3,30"
    />
  </FormKit>
</template>
