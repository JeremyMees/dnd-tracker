<script setup lang="ts">
import { togglePasswordInput } from '~/utils/ui-helpers'

useSeo('Reset password')

const { t } = useI18n()
const auth = useAuth()
const toast = useToast()
const localePath = useLocalePath()
const route = useRoute()

onMounted(() => checkIfError())

function checkIfError(): void {
  const { error } = route.query

  if (error) {
    navigateTo(localePath('/forgot-password'))

    toast.error({
      title: t('pages.resetPassword.toast.error.title'),
      text: t('pages.resetPassword.toast.error.text'),
    })
  }
}

async function resetPassword({ password }: ResetPassword, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    await auth.updatePassword({ password })

    toast.success({ title: t('pages.resetPassword.toast.success.title') })

    navigateTo(localePath('/'))
  }
  catch (err: any) {
    node.setErrors(err.message)
    toast.error()
  }
}
</script>

<template>
  <NuxtLayout name="centered">
    <section class="space-y-6">
      <h1 class="text-center pb-10">
        {{ t('pages.resetPassword.title') }}
      </h1>
      <FormKit
        type="form"
        :submit-label="t('pages.resetPassword.reset')"
        @submit="resetPassword"
      >
        <FormKit
          name="password"
          type="password"
          suffix-icon="eye"
          :label="t('components.inputs.passwordLabel')"
          validation="required|length:6,50|contains_lowercase|contains_uppercase|contains_alpha|contains_numeric|contains_symbol"
          @suffix-icon-click="togglePasswordInput"
        />
      </FormKit>
      <div class="flex flex-wrap gap-2 justify-center">
        <RouteLink
          url="/"
          class="btn-text"
        >
          {{ t('actions.cancel') }}
        </RouteLink>
      </div>
    </section>
  </NuxtLayout>
</template>
