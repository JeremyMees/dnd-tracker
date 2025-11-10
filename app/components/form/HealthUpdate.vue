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

const selectedType = ref<HealthType>('heal')

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

    const { row, toasts } = handleHpChanges(
      values.amount,
      selected,
      props.item,
      props.sheet?.settings?.negative ?? false,
    )

    props.handleToasts(toasts)

    await props.updateRow(row)

    if (selected === 'heal') animateTableUpdate(`${props.item.id}-hp`, 'green')
    if (selected === 'damage') animateTableUpdate(`${props.item.id}-hp`, 'red')
  }
  catch (err: any) {
    formError.value = err.message || 'An error occurred while updating HP'
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
        @click="selectedType = 'heal'"
      >
        <Icon
          name="tabler:heart"
          aria-hidden="true"
        />
        {{ $t('actions.heal') }}
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
        @click="selectedType = 'damage'"
      >
        <Icon
          name="tabler:sword"
          aria-hidden="true"
        />
        {{ $t('actions.damage') }}
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
