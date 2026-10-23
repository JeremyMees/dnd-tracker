<script setup lang="ts">
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { maxHealthAndArmour } from '~~/constants/validation'

const props = defineProps<{
  item: InitiativeSheetRow
  apply: (change: DndAcChange) => Promise<void>
}>()

const formSchema = z.object({
  amount: z.int().min(0).max(maxHealthAndArmour),
  reset: z.boolean().optional(),
})

const { handleSubmit, setFieldValue } = useForm({
  validationSchema: formSchema,
  initialValues: {
    ...(props.item.maxArmorClassOld
      ? { amount: props.item.maxArmorClass }
      : {}),
  },
})

const formError = ref<string>('')

const onSubmit = handleSubmit(async values => {
  formError.value = ''

  try {
    const amount = parseInteger(values.amount)

    await props.apply(
      values.reset || amount === props.item.maxArmorClassOld
        ? { type: 'override-reset', amount: props.item.maxArmorClassOld ?? 0 }
        : { type: 'override', amount },
    )
  } catch (err) {
    formError.value =
      getErrorMessage(err) || 'An error occurred while updating base AC'
  }
})
</script>

<template>
  <UiFormWrapper @submit="onSubmit">
    <UiFormField v-slot="{ componentField }" name="amount">
      <UiFormItem v-auto-animate>
        <UiFormLabel required>
          {{ $t('components.inputs.overrideFieldLabel', { field: 'AC' }) }}
        </UiFormLabel>
        <UiFormControl>
          <UiInputGroup>
            <UiInputGroupInput type="number" v-bind="componentField" />
            <UiInputGroupAddon align="inline-end">
              <UiInputGroupButton
                type="submit"
                :aria-label="
                  item.maxArmorClassOld
                    ? $t('actions.reset')
                    : $t('actions.save')
                "
                @click="setFieldValue('reset', !!item.maxArmorClassOld)"
              >
                <Icon
                  :name="
                    item.maxArmorClassOld
                      ? 'tabler:player-skip-back'
                      : 'tabler:device-floppy'
                  "
                />
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
    <div v-if="formError" class="text-sm text-destructive">
      {{ formError }}
    </div>
  </UiFormWrapper>
</template>
