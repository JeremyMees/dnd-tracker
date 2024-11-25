<script setup lang="ts">
import { reset } from '@formkit/core'

const emit = defineEmits<{
  close: []
  finished: []
}>()

const props = defineProps<{ current: CampaignFull }>()

const campaign = useCampaigns()
const toast = useToast()
const { t } = useI18n()

async function handleSubmit(form: TransformForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    const formData = sanitizeForm<TransformForm>(form)
    const oldOwner = props.current.created_by
    const newOwner = props.current.team?.find(t => t.user.id === formData.user)
    const campaignId = props.current.id

    if (!newOwner) return

    if (formData.role !== 'Remove') {
      await campaign.addCampaignTeamMember({
        role: formData.role,
        user: oldOwner.id,
        campaign: campaignId,
      })
    }

    await campaign.deleteCampaignTeamMember(newOwner.id)
    await campaign.updateCampaign({ created_by: newOwner.user.id }, campaignId)

    toast.success({
      title: t('components.transferOwnershipModal.toast.success.title', { username: newOwner.user.username }),
    })

    emit('finished')
    emit('close')
  }
  catch (err: any) {
    reset('form')
    node.setErrors(err.message)
  }
}
</script>

<template>
  <FormKit
    id="form"
    type="form"
    :submit-label="t('actions.transfer')"
    @submit="handleSubmit"
  >
    <FormKit
      name="role"
      type="radio"
      validation="required"
      :label="t('components.inputs.newRoleLabel')"
      :options="[
        { label: t('general.roles.Admin.title'), value: 'Admin' },
        { label: t('general.roles.Viewer.title'), value: 'Viewer' },
        { label: t('components.transferOwnershipModal.removed'), value: 'Remove' },
      ]"
    />
    <FormKit
      name="user"
      type="radio"
      validation="required"
      :label="t('components.inputs.newOwnerLabel')"
      :options="current.team.map(({ user }) => ({
        label: `${user.name} (${user.username})`,
        value: user.id,
      }))"
    />
    <SplitText
      :text="t('components.transferOwnershipModal.text', { campaign: current.title })"
      :split="current.title"
      classes="font-bold last:hidden text-danger"
      class="py-4 body-small"
    />
    <FormKit
      name="title"
      :label="t('components.inputs.titleLabel')"
      :validation="`required|is:${current.title}`"
      :placeholder="current.title"
    />
  </FormKit>
</template>
