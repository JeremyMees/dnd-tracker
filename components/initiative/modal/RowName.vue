<script setup lang="ts">
import { reset } from '@formkit/core'

const emit = defineEmits<{
  close: []
}>()

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
    reset('form')
    node.setErrors(err.message)
  }
}
</script>

<template>
  <FormKit
    id="form"
    type="form"
    :submit-label="$t('actions.save')"
    @submit="handleSubmit"
  >
    <FormKit
      name="name"
      :label="$t('components.inputs.nameLabel')"
      :value="name"
    />
  </FormKit>
</template>
