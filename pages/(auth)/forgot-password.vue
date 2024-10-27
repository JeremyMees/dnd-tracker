<script setup lang="ts">
definePageMeta({ middleware: ['abort-authenticated'] })
useSeo('Forgot password')

const { t } = useI18n()
const auth = useAuth()
const toast = useToast()
const localePath = useLocalePath()

async function forgotPassword(form: ForgotPassword, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    await auth.forgotPassword(form.email)

    toast.success({
      title: t('pages.forgotPassword.toast.success.title'),
      text: t('pages.forgotPassword.toast.success.text'),
    })

    navigateTo(localePath('/login'))
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
        {{ t('pages.forgotPassword.title') }}
      </h1>
      <FormKit
        type="form"
        :submit-label="t('pages.forgotPassword.reset')"
        @submit="forgotPassword"
      >
        <FormKit
          name="email"
          :label="t('components.inputs.emailLabel')"
          validation="required|length:5,50|email"
          required
        />
      </FormKit>
      <div class="flex flex-wrap gap-2 justify-center">
        <RouteLink
          url="register"
          class="btn-text"
        >
          {{ t('pages.login.new') }}
        </RouteLink>
        <RouteLink
          url="login"
          class="btn-text"
        >
          {{ t('pages.login.signIn') }}
        </RouteLink>
      </div>
    </section>
  </NuxtLayout>
</template>
