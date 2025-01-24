<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'

useSeo('Contact')

const { t } = useI18n()
const { toast } = useToast()
const localePath = useLocalePath()

async function sendContactMail(form: Contact, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    const { error } = await useFetch('/api/emails/contact-request', {
      method: 'POST',
      body: sanitizeForm<Contact>(form),
    })

    if (error.value) throw createError(error.value)

    toast({
      description: t('pages.contact.success'),
      variant: 'success',
    })

    navigateTo(localePath('/'))
  }
  catch (err: any) {
    toast({
      description: t('general.mail.fail.text'),
      title: t('general.mail.fail.title'),
      variant: 'destructive',
    })

    node.setErrors(err.message)
  }
}
</script>

<template>
  <NuxtLayout name="centered">
    <template #header>
      <h1>
        {{ $t('pages.contact.title') }}
      </h1>
    </template>

    <FormKit
      type="form"
      :submit-label="t('pages.contact.send')"
      @submit="sendContactMail"
    >
      <FormKit
        name="name"
        :label="$t('components.inputs.nameLabel')"
        validation="length:3,30|alpha_spaces"
      />
      <FormKit
        name="email"
        :label="$t('components.inputs.emailLabel')"
        validation="required|length:5,50|email"
      />
      <FormKit
        name="question"
        type="textarea"
        :maxlength="1000"
        :label="$t('components.inputs.questionLabel')"
        validation="required|length:3,1000"
      />
    </FormKit>
  </NuxtLayout>
</template>
