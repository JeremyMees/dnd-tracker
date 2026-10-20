<script setup lang="ts">
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { damageTypes } from '~~/constants/dnd'
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
  damageType: z.enum(damageTypeEnum).optional(),
})

const form = useForm({
  validationSchema: formSchema,
})

const formError = ref<string>('')

const defense = computed(() =>
  damageDefense(props.item, form.values.damageType),
)

const onSubmit = form.handleSubmit(async values => {
  formError.value = ''

  try {
    const selected = selectedType.value

    if (!props.sheet || !selected) return

    const rolled = parseInteger(values.amount)
    const amount =
      selected === 'damage'
        ? damageAfterDefenses(props.item, [
            { amount: rolled, type: values.damageType },
          ])
        : rolled

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
    <UiFormField v-slot="{ value, handleChange }" name="damageType">
      <UiFormItem>
        <UiFormLabel>
          {{ $t('components.inputs.damageTypeLabel') }}
        </UiFormLabel>
        <UiSelect
          :model-value="value ?? 'none'"
          @update:model-value="v => handleChange(v === 'none' ? undefined : v)"
        >
          <UiFormControl>
            <UiSelectTrigger test-id="damage-type">
              <UiSelectValue />
            </UiSelectTrigger>
          </UiFormControl>
          <UiSelectContent>
            <UiSelectGroup>
              <UiSelectItem value="none">
                {{ $t('components.inputs.nothing') }}
              </UiSelectItem>
              <UiSelectItem
                v-for="type in damageTypes"
                :key="type"
                :value="type"
              >
                {{ type.charAt(0).toUpperCase() + type.slice(1) }}
              </UiSelectItem>
            </UiSelectGroup>
          </UiSelectContent>
        </UiSelect>
        <p
          v-if="defense"
          test-id="defense"
          class="text-xs text-muted-foreground"
        >
          {{ $t(`components.areaDamage.defense.${defense}`) }}
        </p>
      </UiFormItem>
    </UiFormField>
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
