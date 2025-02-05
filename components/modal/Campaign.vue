<script setup lang="ts">
import { reset } from '@formkit/core'

const emit = defineEmits<{ close: [] }>()

const props = defineProps<{ campaign?: CampaignItem | CampaignRow }>()

const user = useAuthenticatedUser()
const { mutateAsync: createCampaign } = useCampaignCreate()
const { mutateAsync: updateCampaign } = useCampaignUpdate()

const input = ref()

onMounted(() => input.value && focusInput(input.value))

async function handleSubmit(form: CampaignForm, node: FormNode): Promise<void> {
  node.clearErrors()

  const onError = (error: string) => {
    reset('Campaign')
    node.setErrors(error)
  }

  const onSuccess = () => emit('close')

  const formData = sanitizeForm<CampaignForm>(form)

  if (props.campaign) {
    await updateCampaign({
      data: formData,
      id: props.campaign.id,
      onError,
      onSuccess,
    })
  }
  else {
    await createCampaign({
      data: { ...formData, created_by: user.value.id },
      onError,
      onSuccess,
    })
  }
}
</script>

<template>
  <FormKit
    id="Campaign"
    type="form"
    :actions="false"
    @submit="handleSubmit"
  >
    <FormKit
      ref="input"
      name="title"
      :label="$t('components.inputs.titleLabel')"
      :value="campaign?.title ? campaign.title : ''"
      validation="required|length:3,30"
      outer-class="$remove:mb-4"
    />
  </FormKit>
</template>
