<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { useTeamMemberCreate, useTeamMemberRemove } from '~~/queries/team-members'
import { useCampaignUpdate } from '~~/queries/campaigns'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { campaignTransferRole } from '~~/constants/validation'

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

const formSchema = toTypedSchema(z.object({
  role: z.enum(campaignTransferRole),
  user: z.string(),
  title: z.string().min(1).max(100).refine(val => val === props.current.title, {
    message: t('zod.match', { field: props.current.title }),
  }),
}))

const form = useForm({
  validationSchema: formSchema,
})

const formError = ref<string>('')

const currentTeamMemberSubscription = computed<SubscriptionType | undefined>(() => {
  const member = props.current.team?.find(t => t.user.id === form.values.user)
  return member?.user.subscription_type
})

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  const oldOwner = props.current.created_by
  const newOwner = props.current.team?.find(t => t.user.id === values.user)
  const campaignId = props.current.id

  if (!newOwner) return

  if (
    currentTeamMemberSubscription.value === 'pro'
    && values.role !== 'Remove'
  ) {
    await createTeamMember({
      data: {
        role: values.role,
        user: oldOwner.id,
        campaign: campaignId,
      },
      onError: (err: string) => formError.value = err,
    })
  }

  await removeTeamMember({
    member: newOwner.id,
    campaign: campaignId,
    onError: (err: string) => formError.value = err,
  })

  await updateCampaign({
    data: { created_by: newOwner.user.id },
    id: campaignId,
    onError: (err: string) => formError.value = err,
  })

  toast({
    description: t('components.transferOwnershipModal.toast.success.title', { username: newOwner.user.username }),
    variant: 'success',
  })

  emit('finished')
  emit('close')
})
</script>

<template>
  <UiFormWrapper @submit="onSubmit">
    <UiFormField
      v-slot="{ componentField }"
      name="role"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel required>
          {{ $t('components.inputs.newRoleLabel') }}
        </UiFormLabel>
        <UiSelect v-bind="componentField">
          <UiFormControl>
            <UiSelectTrigger>
              <UiSelectValue :placeholder="$t('components.inputs.nothing')" />
            </UiSelectTrigger>
          </UiFormControl>
          <UiSelectContent>
            <UiSelectGroup>
              <UiSelectItem
                v-for="option in [
                  { label: $t('general.roles.Admin.title'), value: 'Admin' },
                  { label: $t('general.roles.Viewer.title'), value: 'Viewer' },
                  { label: $t('components.transferOwnershipModal.removed'), value: 'Remove' },
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
    <UiFormField
      v-slot="{ componentField }"
      name="user"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel required>
          {{ $t('components.inputs.newOwnerLabel') }}
        </UiFormLabel>
        <UiSelect v-bind="componentField">
          <UiFormControl>
            <UiSelectTrigger>
              <UiSelectValue :placeholder="$t('components.inputs.nothing')" />
            </UiSelectTrigger>
          </UiFormControl>
          <UiSelectContent>
            <UiSelectGroup>
              <UiSelectItem
                v-for="option in current.team.map(({ user }) => ({
                  label: `${user.name} (${user.username})`,
                  value: user.id,
                }))"
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
      v-if="currentTeamMemberSubscription && currentTeamMemberSubscription !== 'pro'"
      class="text-sm text-destructive-foreground bg-destructive/50 border-2 border-destructive rounded-md p-2"
    >
      {{ $t('components.transferOwnershipModal.free') }}
    </div>

    <I18nT
      keypath="components.transferOwnershipModal.text"
      tag="p"
      scope="global"
      class="text-sm"
    >
      <template #campaign>
        <span class="font-bold text-destructive">
          {{ current.title }}
        </span>
      </template>
    </I18nT>

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
            v-bind="componentField"
            type="text"
            :placeholder="current.title"
          />
        </UiFormControl>
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
      variant="destructive"
      class="w-full"
    >
      {{ $t('actions.transfer') }}
    </UiButton>
  </UiFormWrapper>
</template>
