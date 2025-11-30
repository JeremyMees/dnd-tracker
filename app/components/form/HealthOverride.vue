<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const props = defineProps<{
  sheet: InitiativeSheet | undefined
  item: InitiativeSheetRow
  handleToasts: (toasts: ToastItem[]) => void
  updateRow: (row: Partial<InitiativeSheetRow>) => Promise<void>
}>()

const formSchema = toTypedSchema(z.object({
  amount: z.number().min(0).max(1000),
  reset: z.boolean().optional(),
}))

const { handleSubmit, setFieldValue } = useForm({
  validationSchema: formSchema,
  initialValues: {
    ...(props.item.maxHealthOld ? { amount: props.item.maxHealth } : { }),
  },
})

const formError = ref<string>('')

const onSubmit = handleSubmit(async (values) => {
  formError.value = ''

  try {
    if (!props.sheet) return

    const { amount, reset } = values

    const { row, toasts } = reset || amount === props.item.maxHealthOld
      ? handleHpChanges(
          props.item.maxHealthOld ?? 0,
          'override-reset',
          props.item,
          props.sheet?.settings?.negative ?? false,
        )
      : handleHpChanges(
          amount,
          'override',
          props.item,
          props.sheet?.settings?.negative ?? false,
        )

    props.handleToasts(toasts)

    await props.updateRow(row)
  }
  catch (err: any) {
    formError.value = err.message || 'An error occurred while updating base HP'
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
          {{ $t('components.inputs.overrideFieldLabel', { field: 'HP' }) }}
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
                :aria-label="item.maxHealthOld ? $t('actions.reset') : $t('actions.save')"
                @click="setFieldValue('reset', !!item.maxHealthOld)"
              >
                <Icon :name="item.maxHealthOld ? 'tabler:player-skip-back' : 'tabler:device-floppy'" />
              </UiInputGroupButton>
            </UiInputGroupAddon>
          </UiInputGroup>
        </UiFormControl>
        <UiFormDescription>
          {{ $t('components.inputs.optionalFieldHelp', { field: 'HP' }) }}
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
