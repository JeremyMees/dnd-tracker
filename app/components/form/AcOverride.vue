<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const props = defineProps<{
  sheet: InitiativeSheet | undefined
  item: InitiativeSheetRow
  handleAcChanges: (amount: number, type: AcType) => Partial<InitiativeSheetRow>
  updateRow: (row: Partial<InitiativeSheetRow>) => Promise<void>
}>()

const formSchema = toTypedSchema(z.object({
  amount: z.number().min(0).max(1000),
  reset: z.boolean().optional(),
}))

const { handleSubmit, setFieldValue } = useForm({
  validationSchema: formSchema,
  initialValues: {
    ...(props.item.maxAcOld ? { amount: props.item.maxAc } : { }),
  },
})

const formError = ref<string>('')

const onSubmit = handleSubmit(async (values) => {
  formError.value = ''

  try {
    if (!props.sheet) return

    const { amount, reset } = values

    const row = reset || amount === props.item.maxAcOld
      ? props.handleAcChanges(props.item.maxAcOld ?? 0, 'override-reset')
      : props.handleAcChanges(amount, 'override')

    await props.updateRow(row)
  }
  catch (err: any) {
    formError.value = err.message || 'An error occurred while updating base AC'
  }
})
</script>

<template>
  <UiFormWrapper @submit="onSubmit">
    <UiFormField
      v-slot="{ componentField }"
      name="amount"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel required>
          {{ $t('components.inputs.overrideFieldLabel', { field: 'AC' }) }}
        </UiFormLabel>
        <UiFormControl>
          <UiInputGroup>
            <UiInputGroupInput
              type="number"
              v-bind="componentField"
            />
            <UiInputGroupAddon align="inline-end">
              <UiInputGroupButton
                type="submit"
                :aria-label="item.maxAcOld ? $t('actions.reset') : $t('actions.save')"
                @click="setFieldValue('reset', !!item.maxAcOld)"
              >
                <Icon :name="item.maxAcOld ? 'tabler:player-skip-back' : 'tabler:device-floppy'" />
              </UiInputGroupButton>
            </UiInputGroupAddon>
          </UiInputGroup>
        </UiFormControl>
        <UiFormDescription>
          {{ $t('components.inputs.optionalFieldHelp', { field: 'AC' }) }}
        </UiFormDescription>
        <UiFormMessage />
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
