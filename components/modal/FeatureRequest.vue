<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()

const { user } = useAuthentication()
const { t } = useI18n()

const input = ref()

const { mutateAsync: create } = useFeatureCreate()

onMounted(() => input.value && focusInput(input.value))

interface FeatureForm { title: string, text: string }

async function handleSubmit(form: FeatureForm, node: FormNode): Promise<void> {
  node.clearErrors()

  const formData = sanitizeForm<FeatureForm>(form)

  await create({
    data: {
      ...formData,
      created_by: user.value!.id,
      voted: {
        like: [user.value!.id],
        dislike: [],
      },
    },
    onSuccess: async () => {
      await sendFeatureEmail(formData)

      emit('close')
    },
    onError: (error) => {
      node.setErrors(error)
    },
  })
}

async function sendFeatureEmail(form: FeatureForm): Promise<void> {
  if (!user.value) return

  const { error } = await useFetch('/api/emails/feature-request', {
    method: 'POST',
    body: {
      ...form,
      name: user.value.username,
      email: user.value.email,
    },
  })

  if (error.value) throw createError(t('general.mail.fail.text'))
}
</script>

<template>
  <FormKit
    id="FeatureRequest"
    type="form"
    :actions="false"
    @submit="handleSubmit"
  >
    <FormKit
      ref="input"
      name="title"
      :label="$t('components.inputs.titleLabel')"
      validation="required|length:3,50"
    />
    <FormKit
      type="textarea"
      name="text"
      :maxlength="500"
      :label="$t('components.inputs.descriptionLabel')"
      validation="required|length:10,500"
      outer-class="$remove:mb-4"
    />
  </FormKit>
</template>
