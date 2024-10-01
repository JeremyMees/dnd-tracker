<script setup lang="ts">
useHead({ title: 'Forgot password' })

const { t } = useI18n()
const auth = useAuth()
// const toast = useToastStore()
const localePath = useLocalePath()

const form = ref<{ email: string }>({ email: '' })
const isLoading = ref<boolean>(false)
const error = ref<string | null>(null)

async function forgotPassword({ __init, email }: Obj): Promise<void> {
  error.value = null
  try {
    isLoading.value = true
    await auth.forgotPassword(email)
    // toast.success({
    //   title: t('pages.forgotPassword.toast.success.title'),
    //   text: t('pages.forgotPassword.toast.success.text'),
    // })
    navigateTo(localePath('/login'))
  }
  catch (err: any) {
    console.error(err)
    error.value = err.message
    // toast.error()
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <NuxtLayout name="centered">
    <section class="space-y-6">
      <h1 class="text-center pb-10">
        {{ t('pages.forgotPassword.title') }}
      </h1>
      <p
        v-if="error"
        class="text-danger text-center"
      >
        {{ error }}
      </p>
      <FormKit
        v-model="form"
        type="form"
        :actions="false"
        @submit="forgotPassword"
      >
        <FormKit
          name="email"
          :label="t('components.inputs.emailLabel')"
          validation="required|length:5,50|email"
          required
        />
        <FormKit
          type="submit"
          :aria-label="t('pages.forgotPassword.reset')"
          :disabled="isLoading"
          input-class="w-full"
        >
          {{ t('pages.forgotPassword.reset') }}
        </FormKit>
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
