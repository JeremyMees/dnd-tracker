<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const emit = defineEmits<{ close: [] }>()
const props = defineProps<{ send: (addresses: string[]) => void }>()

const formSchema = toTypedSchema(z.object({
  mail: z.array(z.string().min(5).max(50).email()).min(1).max(10),
}))

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    mail: [''],
  },
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  try {
    props.send(values.mail)
    emit('close')
  }
  catch (err: any) {
    formError.value = err.message
  }
})
</script>

<template>
  <UiFormWrapper @submit="onSubmit">
    <FormListInput
      name="mail"
      type="email"
      :empty="''"
      :label="$t('components.inputs.emailLabel', 2)"
      :required="true"
      :max="10"
      :min="1"
    />
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
      {{ $t('actions.sendMail') }}
    </UiButton>
  </UiFormWrapper>
</template>
