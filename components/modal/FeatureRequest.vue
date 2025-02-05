<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'

const emit = defineEmits<{ finished: [] }>()

const feature = useFeatures()
const { user } = useAuthentication()
const { toast } = useToast()
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
      created_by: user.value!.id,
      voted: {
        like: [user.value!.id],
        dislike: [],
      },
    }

    await feature.addFeature(newFeature)
    await sendFeatureEmail(formData)

    emit('finished')

    isAccepted.value = true
  }
  catch (err: any) {
    toast({
      description: err.message,
      variant: 'destructive',
    })
    node.setErrors(err.message)
  }
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
  <template v-if="!isAccepted">
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
  <p
    v-else
    class="text-muted-foreground"
  >
    {{ $t('components.addFeatureRequestModal.submitted') }}
  </p>
</template>
