<script setup lang="ts">
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { maxHealthAndArmour } from '~~/constants/validation'

const props = defineProps<{
  item: InitiativeSheetRow
  apply: (change: DndAcChange) => Promise<void>
}>()

const selectedType = ref<DndAcType>('remove')

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

    await props.apply({ type: selected, amount: parseInteger(values.amount) })

    if (selected === 'add') animateTableUpdate(`${props.item.id}-ac`, 'green')
    if (selected === 'remove') animateTableUpdate(`${props.item.id}-ac`, 'red')
  } catch (err) {
    formError.value =
      getErrorMessage(err) || 'An error occurred while updating AC'
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
        <Icon name="tabler:arrow-big-up" aria-hidden="true" />
        {{ $t('actions.increase') }}
      </UiButton>
      <UiButton
        type="submit"
        size="sm"
        variant="warning"
        class="border-2"
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
        @click="selectedType = 'remove'"
      >
        <Icon name="tabler:arrow-big-down" aria-hidden="true" />
        {{ $t('actions.decrease') }}
      </UiButton>
    </div>
    <div v-if="formError" class="text-sm text-destructive">
      {{ formError }}
    </div>
  </UiFormWrapper>
</template>
