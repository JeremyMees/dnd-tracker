<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'

definePageMeta({ middleware: ['abort-authenticated'] })
useSeo('Forgot password')

const { t } = useI18n()
const auth = useAuth()
const { toast } = useToast()
const localePath = useLocalePath()

async function forgotPassword(form: ForgotPassword, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    await auth.forgotPassword(form.email)

    toast({
      title: t('pages.forgotPassword.toast.success.title'),
      description: t('pages.forgotPassword.toast.success.text'),
      variant: 'success',
    })

    navigateTo(localePath('/login'))
  }
  catch (err: any) {
    node.setErrors(err.message)

    toast({
      title: t('general.error.title'),
      description: t('general.error.text'),
      variant: 'destructive',
    })
  }
}
</script>

<template>
  <NuxtLayout name="centered">
    <template #header>
      <h1 class="text-center">
        {{ $t('pages.forgotPassword.title') }}
      </h1>
    </template>

    <FormKit
      type="form"
      :submit-label="$t('pages.forgotPassword.reset')"
      @submit="forgotPassword"
    >
      <FormKit
        name="email"
        :label="$t('components.inputs.emailLabel')"
        validation="required|length:5,50|email"
        required
      />
    </FormKit>

    <template #footer>
      <div class="flex flex-wrap gap-2 justify-center">
        <NuxtLinkLocale
          to="/register"
          class="btn-text"
        >
          {{ $t('pages.login.new') }}
        </NuxtLinkLocale>
        <NuxtLinkLocale
          to="/login"
          class="btn-text"
        >
          {{ $t('pages.login.signIn') }}
        </NuxtLinkLocale>
      </div>
    </template>
  </NuxtLayout>
</template>
