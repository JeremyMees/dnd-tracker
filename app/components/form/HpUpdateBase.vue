<script setup lang="ts">
import { useForm } from 'vee-validate'
import * as z from 'zod'

const props = defineProps<{
  sheet: InitiativeSheet | undefined
  item: InitiativeSheetRow
  handleToasts: (toasts: ToastItem[]) => void
  updateRow: (row: Partial<InitiativeSheetRow>) => Promise<void>
}>()

const formSchema = z.object({
  amount: z.int().min(0).max(1000),
})

const form = useForm({
  validationSchema: formSchema,
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async values => {
  formError.value = ''

  try {
    if (!props.sheet) return

    const amount = parseInteger(values.amount)

    const row = {
      ...props.item,
      maxHitPoints: amount,
      maxHitPointsOld: undefined,
      hitPoints: amount,
    }

    await props.updateRow(row)
  } catch (err) {
    formError.value =
      getErrorMessage(err) || 'An error occurred while updating base HP'
  }
})
</script>

<template>
  <UiFormWrapper @submit="onSubmit">
    <UiFormField v-slot="{ componentField }" name="amount">
      <UiFormItem v-auto-animate>
        <UiFormLabel required>
          {{ $t('components.inputs.baseFieldLabel', { field: 'HP' }) }}
        </UiFormLabel>
        <UiFormControl>
          <UiInputGroup>
            <UiInputGroupInput type="number" v-bind="componentField" />
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
          {{ $t('components.inputs.baseFieldHelp', { field: 'HP' }) }}
        </UiFormDescription>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
    <div v-if="formError" class="text-sm text-destructive">
      {{ formError }}
    </div>
  </UiFormWrapper>
</template>
