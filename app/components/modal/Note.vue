<script setup lang="ts">
import { useNoteCreate, useNoteUpdate } from '~~/queries/notes'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const emit = defineEmits<{ close: [] }>()

const props = defineProps<{
  campaignId: number
  note?: NoteRow
}>()

const { mutateAsync: createNote } = useNoteCreate()
const { mutateAsync: updateNote } = useNoteUpdate()

const formSchema = toTypedSchema(z.object({
  title: z.string().min(5).max(50),
  text: z.string().min(10).max(5000),
}))

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    title: props.note?.title || '',
    text: props.note?.text || '',
  },
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  const formData = {
    ...values,
    campaign: props.campaignId,
  }

  if (props.note) {
    await updateNote({
      data: formData,
      id: props.note.id,
      onSuccess: () => emit('close'),
      onError: (err: string) => formError.value = err,
    })
  }
  else {
    await createNote({
      data: formData,
      onSuccess: () => emit('close'),
      onError: (err: string) => formError.value = err,
    })
  }
})
</script>

<template>
  <UiFormWrapper @submit="onSubmit">
    <UiFormField
      v-slot="{ componentField }"
      name="title"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel required>
          {{ $t('components.inputs.titleLabel') }}
        </UiFormLabel>
        <UiFormControl>
          <UiInput
            type="text"
            v-bind="componentField"
          />
        </UiFormControl>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
    <UiFormField
      v-slot="{ value, setValue, errorMessage }"
      name="text"
    >
      <UiFormItem v-auto-animate>
        <UiFormControl>
          <TextEditor
            :content="value"
            @updated="setValue($event)"
          />
        </UiFormControl>
        <UiFormMessage v-if="errorMessage">
          {{ errorMessage }}
        </UiFormMessage>
      </UiFormItem>
    </UiFormField>
    <div
      v-if="formError"
      class="text-sm text-destructive"
    >
      {{ formError }}
    </div>
    <UiButton
      type="submit"
      class="w-full"
    >
      {{ $t(`components.noteModal.${note ? 'update' : 'add'}`) }}
    </UiButton>
  </UiFormWrapper>
</template>
