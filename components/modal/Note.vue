<script setup lang="ts">
import { FormKitMessages } from '@formkit/vue'
import { reset } from '@formkit/core'

const emit = defineEmits<{
  close: []
  finished: []
}>()

const props = defineProps<{
  campaignId: number
  note?: NoteRow
}>()

const store = useNotes()
const profile = useProfile()

const input = ref()
const hiddenText = ref()
const text = ref<string>(props.note?.text || '')

onMounted(() => {
  if (input.value) focusInput(input.value)
})

async function handleSubmit(form: NoteForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    const formData = {
      ...sanitizeForm<NoteForm>(form),
      campaign: props.campaignId,
    }

    if (props.note) await updateNote(formData)
    else await addNote(formData)

    emit('finished')
    emit('close')
  }
  catch (err: any) {
    reset('Note')
    node.setErrors(err.message)
  }
}

async function addNote(data: NoteInsert): Promise<void> {
  if (profile.user) {
    await store.addNote(data)
  }
}

async function updateNote(data: NoteUpdate): Promise<void> {
  if (props.note) {
    await store.updateNote(data, props.note.id)
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
