<script setup lang="ts">
import { FormKitMessages } from '@formkit/vue'
import { reset } from '@formkit/core'

const emit = defineEmits<{ close: [] }>()

const props = defineProps<{
  campaignId: number
  note?: NoteRow
}>()

const input = ref()
const hiddenText = ref()
const text = ref<string>(props.note?.text || '')

const { mutateAsync: createNote } = useNoteCreate()
const { mutateAsync: updateNote } = useNoteUpdate()

onMounted(() => {
  if (input.value) focusInput(input.value)
})

async function handleSubmit(form: NoteForm, node: FormNode): Promise<void> {
  node.clearErrors()

  const onError = (err: string) => {
    reset('Note')
    node.setErrors(err)
  }

  const formData = {
    ...sanitizeForm<NoteForm>(form),
    campaign: props.campaignId,
  }

  if (props.note) {
    await updateNote({
      data: formData,
      id: props.note.id,
      onSuccess: () => emit('close'),
      onError,
    })
  }
  else {
    await createNote({
      data: formData,
      onSuccess: () => emit('close'),
      onError,
    })
  }
}
</script>

<template>
  <FormKit
    id="Note"
    type="form"
    :actions="false"
    @submit="handleSubmit"
  >
    <FormKit
      ref="input"
      name="title"
      :label="$t('components.inputs.titleLabel')"
      :value="note?.title"
      validation="required|length:3,30"
    />
    <FormKit
      ref="hiddenText"
      v-model="text"
      type="hidden"
      name="text"
      validation="required|length:10,5000"
    />

    <TextEditor
      color="background"
      :content="text"
      @updated="text = $event"
    >
      <template #error>
        <FormKitMessages :node="hiddenText?.node" />
      </template>
    </TextEditor>
  </FormKit>
</template>
