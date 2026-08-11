<script setup lang="ts">
import { useForm } from 'vee-validate'
import * as z from 'zod'

const props = defineProps<{
  row: PlayerRow
  pending: boolean
  apply: (action: LiveAction, patch: Partial<PlayerRow>) => Promise<void>
}>()

const selected = ref<'add' | 'remove' | 'temp'>('add')

const form = useForm({
  validationSchema: z.object({ amount: z.int().min(0).max(1000) }),
})

function predict(
  acType: 'add' | 'remove' | 'temp',
  amount: number,
): Partial<PlayerRow> {
  if (!isDefined(props.row.armorClass)) return {}

  if (acType === 'temp') return { tempArmorClass: amount }
  if (acType === 'add') return { armorClass: props.row.armorClass + amount }

  const temp = props.row.tempArmorClass ?? 0

  if (temp >= amount) return { tempArmorClass: temp - amount }

  return {
    tempArmorClass: 0,
    armorClass: props.row.armorClass - (amount - temp),
  }
}

const onSubmit = form.handleSubmit(async values => {
  const amount = parseInteger(values.amount)

  await props.apply(
    { type: 'ac', acType: selected.value, amount },
    predict(selected.value, amount),
  )
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-xs font-bold text-muted-foreground">
      {{ $t('general.ac') }}
    </span>
    <UiFormWrapper @submit="onSubmit">
      <FormDiceRollInput />
      <div class="flex items-center gap-x-2">
        <UiButton
          test-id="add-ac"
          type="submit"
          size="sm"
          variant="success"
          class="border-2"
          :disabled="pending"
          @click="selected = 'add'"
        >
          <Icon name="tabler:arrow-big-up" aria-hidden="true" />
          {{ $t('actions.increase') }}
        </UiButton>
        <UiButton
          test-id="temp-ac"
          type="submit"
          size="sm"
          variant="warning"
          class="border-2"
          :disabled="pending"
          @click="selected = 'temp'"
        >
          <Icon name="tabler:plus" aria-hidden="true" />
          {{ $t('actions.temp') }}
        </UiButton>
        <UiButton
          test-id="remove-ac"
          type="submit"
          size="sm"
          variant="destructive"
          class="border-2"
          :disabled="pending"
          @click="selected = 'remove'"
        >
          <Icon name="tabler:arrow-big-down" aria-hidden="true" />
          {{ $t('actions.decrease') }}
        </UiButton>
      </div>
    </UiFormWrapper>
  </div>
</template>
