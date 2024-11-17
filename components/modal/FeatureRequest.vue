<script setup lang="ts">
const emit = defineEmits<{ finished: [] }>()

const feature = useFeatures()
const profile = useProfile()
const toast = useToast()
const { t } = useI18n()

const isAccepted = ref<boolean>(false)
const input = ref()

onMounted(() => input.value && focusInput(input.value))

async function handleSubmit(form: FeatureForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    const formData = sanitizeForm<FeatureForm>(form)

    const newFeature: FeatureInsert = {
      ...formData,
      created_by: profile.data!.id,
      voted: {
        like: [profile.data!.id],
        dislike: [],
      },
    }

    await feature.addFeature(newFeature)
    await sendFeatureEmail(formData)

    emit('finished')

    isAccepted.value = true
  }
  catch (err: any) {
    toast.error({ text: err.message })
    node.setErrors(err.message)
  }
}

async function sendFeatureEmail(form: FeatureForm): Promise<void> {
  if (!profile.data) return

  const { error } = await useFetch('/api/emails/feature-request', {
    method: 'POST',
    body: {
      ...form,
      name: profile.data.username,
      email: profile.data.email,
    },
  })

  if (error.value) throw createError(t('general.mail.fail.text'))
}
</script>

<template>
  <template v-if="!isAccepted">
    <FormKit
      id="form"
      type="form"
      :submit-label="t('actions.create')"
      @submit="handleSubmit"
    >
      <FormKit
        ref="input"
        name="title"
        :label="t('components.inputs.titleLabel')"
        validation="required|length:3,50"
      />
      <FormKit
        type="textarea"
        name="text"
        :maxlength="500"
        :label="t('components.inputs.descriptionLabel')"
        validation="required|length:10,500"
      />
    </FormKit>
  </template>
  <p v-else>
    {{ t('components.addFeatureRequestModal.submitted') }}
  </p>
</template>
