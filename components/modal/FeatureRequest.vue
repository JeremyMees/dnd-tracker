<script setup lang="ts">
const feature = useFeatures()
const profile = useProfile()
const toast = useToast()
const { t } = useI18n()

const isAccepted = ref<boolean>(false)

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

    const feat = await feature.addFeature(newFeature)

    if (feat) await sendFeatureEmail(formData, feat.id)

    isAccepted.value = true
  }
  catch (err: any) {
    toast.error({ text: err.message })
    node.setErrors(err.message)
  }
}

async function sendFeatureEmail(form: FeatureForm, id: number): Promise<void> {
  if (!profile.data) return

  const { error } = await useFetch('/api/emails/feature-request', {
    method: 'POST',
    body: {
      ...form,
      id,
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
