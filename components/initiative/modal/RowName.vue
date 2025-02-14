<script setup lang="ts">
import { reset } from '@formkit/core'

const emit = defineEmits<{ close: [] }>()

const props = defineProps<{
  encounterId: number
  name: string
  submit: (value: string) => Promise<void>
}>()

async function handleSubmit(form: NameForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    const { name } = sanitizeForm<NameForm>(form)

    await props.submit(name)

    emit('close')
  }
  catch (err: any) {
    reset('InitiativeRowName')
    node.setErrors(err.message)
  }
}
</script>

<template>
  <FormKit
    id="InitiativeRowName"
    type="form"
    :actions="false"
    @submit="handleSubmit"
  >
    <FormKit
      name="name"
      :label="$t('components.inputs.nameLabel')"
      :value="name"
      outer-class="$remove:mb-4"
    />
  </FormKit>
</template>
