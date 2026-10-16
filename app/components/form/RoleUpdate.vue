<script lang="ts" setup>
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { useTeamMemberUpdate } from '~/queries/team-members'
import { roleType } from '~~/constants/validation'

const props = defineProps<{
  member: TeamMemberFull
  campaignId: number
  ownerIsPro: boolean
}>()

const { mutateAsync: updateTeamMember } = useTeamMemberUpdate()

const formSchema = z.object({
  role: z.enum(roleType),
})

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    role: props.member.role as (typeof roleType)[number],
  },
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async values => {
  formError.value = ''

  await updateTeamMember({
    data: { role: values.role },
    id: props.member.id,
    campaign: props.campaignId,
    onError: error => (formError.value = error),
  })
})
</script>

<template>
  <UiFormWrapper @submit="onSubmit">
    <UiFormField v-slot="{ componentField, value }" name="role">
      <UiFormItem>
        <UiSelect v-bind="componentField">
          <UiFormControl>
            <div v-auto-animate class="flex items-center gap-1">
              <UiSelectTrigger>
                <UiSelectValue :placeholder="$t('components.inputs.nothing')" />
              </UiSelectTrigger>
              <Tooltip
                v-if="value !== props.member.role"
                :text="$t('actions.save')"
              >
                <UiButton
                  type="submit"
                  size="icon-sm"
                  variant="success-ghost"
                  :aria-label="$t('actions.save')"
                >
                  <Icon name="tabler:device-floppy" aria-hidden="true" />
                </UiButton>
              </Tooltip>
            </div>
          </UiFormControl>
          <UiSelectContent>
            <UiSelectGroup>
              <UiSelectItem value="Viewer">
                {{ $t('general.roles.Viewer.title') }}
              </UiSelectItem>
              <UiSelectItem
                value="Admin"
                test-id="admin-option"
                :disabled="!ownerIsPro && member.role !== 'Admin'"
              >
                {{ $t('general.roles.Admin.title') }}
                <span v-if="!ownerIsPro" class="text-muted-foreground">
                  ({{ $t('general.pro') }})
                </span>
              </UiSelectItem>
            </UiSelectGroup>
          </UiSelectContent>
        </UiSelect>
      </UiFormItem>
    </UiFormField>
    <div v-if="formError" class="text-sm text-destructive">
      {{ formError }}
    </div>
  </UiFormWrapper>
</template>
