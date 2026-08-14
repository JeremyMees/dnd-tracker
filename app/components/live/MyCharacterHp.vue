<script setup lang="ts">
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { maxHealthAndArmour } from '~~/constants/validation'

const props = defineProps<{
  row: PlayerRow
  pending: boolean
  apply: (action: LiveAction, patch: Partial<PlayerRow>) => Promise<void>
}>()

const selected = ref<'heal' | 'damage' | 'temp'>('heal')

const form = useForm({
  validationSchema: z.object({
    amount: z.int().min(0).max(maxHealthAndArmour),
  }),
})

function predict(
  hpType: 'heal' | 'damage' | 'temp',
  amount: number,
): Partial<PlayerRow> {
  if (!isDefined(props.row.hitPoints)) return {}

  if (hpType === 'heal') {
    if (!isDefined(props.row.maxHitPoints)) return {}

    return {
      hitPoints: Math.min(props.row.hitPoints + amount, props.row.maxHitPoints),
    }
  }

  if (hpType === 'temp') return { tempHitPoints: amount }

  const temp = props.row.tempHitPoints ?? 0

  if (temp >= amount) return { tempHitPoints: temp - amount }

  return { tempHitPoints: 0, hitPoints: props.row.hitPoints - (amount - temp) }
}

const onSubmit = form.handleSubmit(async values => {
  const amount = parseInteger(values.amount)

  await props.apply(
    { type: 'hp', hpType: selected.value, amount },
    predict(selected.value, amount),
  )
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-xs font-bold text-muted-foreground">
      {{ $t('general.hp') }}
    </span>
    <UiFormWrapper @submit="onSubmit">
      <FormDiceRollInput />
      <div class="flex items-center gap-x-2">
        <UiButton
          test-id="heal"
          type="submit"
          size="sm"
          variant="success"
          class="border-2"
          :disabled="pending"
          @click="selected = 'heal'"
        >
          <Icon name="tabler:heart" aria-hidden="true" />
          {{ $t('actions.heal') }}
        </UiButton>
        <UiButton
          test-id="temp-hp"
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
          test-id="damage"
          type="submit"
          size="sm"
          variant="destructive"
          class="border-2"
          :disabled="pending"
          @click="selected = 'damage'"
        >
          <Icon name="tabler:sword" aria-hidden="true" />
          {{ $t('actions.damage') }}
        </UiButton>
      </div>
    </UiFormWrapper>
  </div>
</template>
