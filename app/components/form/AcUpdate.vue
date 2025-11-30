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

const selectedType = ref<AcType>('remove')

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
    const selected = selectedType.value

    if (!props.sheet || !selected) return

    const row = props.handleAcChanges(values.amount, selected || 'remove')

    await props.updateRow(row)

    if (selected === 'add') animateTableUpdate(`${props.item.id}-ac`, 'green')
    if (selected === 'remove') animateTableUpdate(`${props.item.id}-ac`, 'red')
  }
  catch (err: any) {
    formError.value = err.message || 'An error occurred while updating AC'
  }
})
</script>

<template>
  <UiFormWrapper @submit="onSubmit">
    <FormDiceRollInput />
    <div class="flex items-center gap-x-2">
      <UiButton
        type="submit"
        size="sm"
        variant="success"
        class="border-2"
        @click="selectedType = 'add'"
      >
        <Icon
          name="tabler:arrow-big-up"
          aria-hidden="true"
        />
        {{ $t('actions.increase') }}
      </UiButton>
      <UiButton
        type="submit"
        size="sm"
        variant="warning"
        class="border-2"
        @click="selectedType = 'temp'"
      >
        <Icon
          name="tabler:plus"
          aria-hidden="true"
        />
        {{ $t('actions.temp') }}
      </UiButton>
      <UiButton
        type="submit"
        size="sm"
        variant="destructive"
        class="border-2"
        @click="selectedType = 'remove'"
      >
        <Icon
          name="tabler:arrow-big-down"
          aria-hidden="true"
        />
        {{ $t('actions.decrease') }}
      </UiButton>
    </div>
    <div
      v-if="formError"
      class="text-sm text-destructive"
    >
      {{ formError }}
    </div>
  </UiFormWrapper>
</template>
