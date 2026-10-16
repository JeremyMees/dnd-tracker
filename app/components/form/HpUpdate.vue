<script setup lang="ts">
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { maxHealthAndArmour } from '~~/constants/validation'

const props = defineProps<{
  sheet: InitiativeSheet | undefined
  item: InitiativeSheetRow
  handleToasts: (toasts: ToastItem[]) => void
  updateRow: (row: Partial<InitiativeSheetRow>) => Promise<void>
  intent?: DndHpType
}>()

const selectedType = ref<DndHpType>('heal')

const formSchema = z.object({
  amount: z.int().min(0).max(maxHealthAndArmour),
})

const form = useForm({
  validationSchema: formSchema,
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async values => {
  formError.value = ''

  try {
    const selected = selectedType.value

    if (!props.sheet || !selected) return

    const amount = parseInteger(values.amount)

    const { row, toasts } = handleHpChanges(
      amount,
      selected,
      props.item,
      props.sheet?.settings?.negative ?? false,
    )

    props.handleToasts(toasts)

    await props.updateRow(row)

    if (selected === 'heal') animateTableUpdate(`${props.item.id}-hp`, 'green')
    if (selected === 'damage') animateTableUpdate(`${props.item.id}-hp`, 'red')
  } catch (err) {
    formError.value =
      getErrorMessage(err) || 'An error occurred while updating HP'
  }
})

function submitIntent(event: KeyboardEvent): void {
  if (!props.intent) return

  event.preventDefault()
  selectedType.value = props.intent
  onSubmit()
}
</script>

<template>
  <UiFormWrapper @submit="onSubmit" @keydown.enter="submitIntent">
    <FormDiceRollInput />
    <div class="flex items-center gap-x-2">
      <UiButton
        type="submit"
        size="sm"
        variant="success"
        class="border-2"
        :class="{ 'ring-2 ring-ring ring-offset-2': intent === 'heal' }"
        test-id="hp-heal"
        @click="selectedType = 'heal'"
      >
        <Icon name="tabler:heart" aria-hidden="true" />
        {{ $t('actions.heal') }}
      </UiButton>
      <UiButton
        type="submit"
        size="sm"
        variant="warning"
        class="border-2"
        :class="{ 'ring-2 ring-ring ring-offset-2': intent === 'temp' }"
        test-id="hp-temp"
        @click="selectedType = 'temp'"
      >
        <Icon name="tabler:plus" aria-hidden="true" />
        {{ $t('actions.temp') }}
      </UiButton>
      <UiButton
        type="submit"
        size="sm"
        variant="destructive"
        class="border-2"
        :class="{ 'ring-2 ring-ring ring-offset-2': intent === 'damage' }"
        test-id="hp-damage"
        @click="selectedType = 'damage'"
      >
        <Icon name="tabler:sword" aria-hidden="true" />
        {{ $t('actions.damage') }}
      </UiButton>
    </div>
    <div v-if="formError" class="text-sm text-destructive">
      {{ formError }}
    </div>
  </UiFormWrapper>
</template>
