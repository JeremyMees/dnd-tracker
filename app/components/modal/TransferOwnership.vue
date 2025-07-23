<script setup lang="ts">
import { reset } from '@formkit/core'
import { useToast } from '~/components/ui/toast/use-toast'
import { useTeamMemberCreate, useTeamMemberRemove } from '~~/queries/team-members'
import { useCampaignUpdate } from '~~/queries/campaigns'

const emit = defineEmits<{
  close: []
  finished: []
}>()

const props = defineProps<{ current: CampaignFull }>()

const { toast } = useToast()
const { t } = useI18n()

const { mutateAsync: createTeamMember } = useTeamMemberCreate()
const { mutateAsync: removeTeamMember } = useTeamMemberRemove()
const { mutateAsync: updateCampaign } = useCampaignUpdate()

const currentTeamMember = ref<string>()

const currentTeamMemberSubscription = computed<SubscriptionType | undefined>(() => {
  const member = props.current.team?.find(t => t.user.id === currentTeamMember.value)
  return member?.user.subscription_type
})

interface TransformForm {
  title: string
  role: UserRole | 'Remove'
  user: string
}

async function handleSubmit(form: TransformForm, node: FormNode): Promise<void> {
  node.clearErrors()

  const formData = sanitizeForm<TransformForm>(form)
  const oldOwner = props.current.created_by
  const newOwner = props.current.team?.find(t => t.user.id === formData.user)
  const campaignId = props.current.id

  const onError = (err: string) => {
    reset('TransferOwnership')
    node.setErrors(err)
  }

  if (!newOwner) return

  if (
    currentTeamMemberSubscription.value === 'pro'
    && formData.role !== 'Remove'
  ) {
    await createTeamMember({
      data: {
        role: formData.role,
        user: oldOwner.id,
        campaign: campaignId,
      },
      onError,
    })
  }

  await removeTeamMember({
    member: newOwner.id,
    campaign: campaignId,
    onError,
  })

  await updateCampaign({
    data: { created_by: newOwner.user.id },
    id: campaignId,
    onError,
  })

  toast({
    description: t('components.transferOwnershipModal.toast.success.title', { username: newOwner.user.username }),
    variant: 'success',
  })

  emit('finished')
  emit('close')
}
</script>

<template>
  <FormKit
    id="TransferOwnership"
    type="form"
    :actions="false"
    @submit="handleSubmit"
  >
    <FormKit
      name="role"
      type="radio"
      validation="required"
      :label="$t('components.inputs.newRoleLabel')"
      :options="[
        { label: $t('general.roles.Admin.title'), value: 'Admin' },
        { label: $t('general.roles.Viewer.title'), value: 'Viewer' },
        { label: $t('components.transferOwnershipModal.removed'), value: 'Remove' },
      ]"
    />
    <FormKit
      name="user"
      type="radio"
      validation="required"
      :label="$t('components.inputs.newOwnerLabel')"
      :options="current.team.map(({ user }) => ({
        label: `${user.name} (${user.username})`,
        value: user.id,
      }))"
      @input="currentTeamMember = $event"
    />
    <AnimationExpand>
      <div
        v-if="currentTeamMemberSubscription && currentTeamMemberSubscription !== 'pro'"
        class="text-sm text-destructive-foreground bg-destructive/50 border-2 border-destructive rounded-md p-2"
      >
        {{ $t('components.transferOwnershipModal.free') }}
      </div>
    </AnimationExpand>
    <I18nT
      keypath="components.transferOwnershipModal.text"
      tag="p"
      scope="global"
      class="py-4 text-sm"
    >
      <template #campaign>
        <span class="font-bold text-destructive">
          {{ current.title }}
        </span>
      </template>
    </I18nT>
    <FormKit
      name="title"
      :label="$t('components.inputs.titleLabel')"
      :validation="`required|is:${current.title}`"
      :placeholder="current.title"
      outer-class="$remove:mb-4"
    />
  </FormKit>
</template>
