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
}))

const form = useForm({
  validationSchema: formSchema,
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  try {
    if (!props.sheet) return

    const row = {
      ...props.item,
      maxAc: values.amount,
      maxAcOld: undefined,
      ac: values.amount,
    }

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
          {{ $t('components.inputs.baseFieldLabel', { field: 'AC' }) }}
        </UiFormLabel>
        <UiFormControl>
          <UiInputGroup>
            <UiInputGroupInput
              type="number"
              v-bind="componentField"
            />
            <UiInputGroupAddon align="inline-end">
              <UiInputGroupButton
                :aria-label="$t('actions.save')"
                type="submit"
              >
                <Icon name="tabler:device-floppy" />
              </UiInputGroupButton>
            </UiInputGroupAddon>
          </UiInputGroup>
        </UiFormControl>
        <UiFormDescription>
          {{ $t('components.inputs.baseFieldHelp', { field: 'AC' }) }}
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
