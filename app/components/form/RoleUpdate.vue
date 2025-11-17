<script lang="ts" setup>
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { useTeamMemberUpdate } from '~~/queries/team-members'
import { roleType } from '~~/constants/validation'

const props = defineProps<{
  member: TeamMemberFull
  campaignId: number
}>()

const { mutateAsync: updateTeamMember } = useTeamMemberUpdate()

const formSchema = toTypedSchema(z.object({
  role: z.enum(roleType),
}))

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    role: props.member.role as typeof roleType[number],
  },
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  await updateTeamMember({
    data: { role: values.role },
    id: props.member.id,
    campaign: props.campaignId,
    onError: error => formError.value = error,
  })
})
</script>

<template>
  <UiFormWrapper @submit="onSubmit">
    <UiFormField
      v-slot="{ componentField, value }"
      name="role"
    >
      <UiFormItem>
        <UiSelect v-bind="componentField">
          <UiFormControl>
            <div
              v-auto-animate
              class="flex items-center gap-1"
            >
              <UiSelectTrigger>
                <UiSelectValue :placeholder="$t('components.inputs.nothing')" />
              </UiSelectTrigger>
              <UiButton
                v-if="value !== props.member.role"
                v-tippy="$t('actions.save')"
                type="submit"
                size="icon-sm"
                variant="success-ghost"
                :aria-label="$t('actions.save')"
              >
                <Icon
                  name="tabler:device-floppy"
                  aria-hidden="true"
                />
              </UiButton>
            </div>
          </UiFormControl>
          <UiSelectContent>
            <UiSelectGroup>
              <UiSelectItem
                v-for="option in [
                  { value: 'Viewer', label: $t('general.roles.Viewer.title') },
                  { value: 'Admin', label: $t('general.roles.Admin.title') },
                ]"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </UiSelectItem>
            </UiSelectGroup>
          </UiSelectContent>
        </UiSelect>
      </UiFormItem>
    </UiFormField>
    <div
      v-if="formError"
      class="text-sm text-destructive"
    >
      {{ formError }}
    </div>
  </UiFormWrapper>
</template>
