<script setup lang="ts">
useHead({ title: 'Log in' })

const auth = useAuth()
const { t } = useI18n()

const form = ref<Login>({ email: '', password: '' })
const isLoading = ref<boolean>(false)
const error = ref<string | null>(null)

async function login({ __init, isTrusted, _vts, ...credentials }: Obj): Promise<void> {
  error.value = null
  try {
    isLoading.value = true
    await auth.login(credentials as Login)
  }
  catch (err: any) {
    console.error(err)
    error.value = err.message
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <NuxtLayout name="centered">
    <section class="space-y-6">
      <h1 class="text-center">
        {{ t('pages.login.title') }}
      </h1>
      <NuxtImg
        src="/classes.png"
        alt="D20 logo dice"
        :width="250"
        :height="250"
        class="mx-auto visibility-pulse"
      />
      <p
        v-if="error"
        class="text-danger text-center body-small"
      >
        {{ error }}
      </p>
      <FormKit
        v-model="form"
        type="form"
        :actions="false"
        @submit="login"
      >
        <FormKit
          name="email"
          :label="t('components.inputs.emailLabel')"
          validation="required|length:5,50|email"
        />
        <FormKit
          name="password"
          type="password"
          :label="t('components.inputs.passwordLabel')"
          validation="required|length:6,50"
        />
        <FormKit
          type="submit"
          :aria-label="t('pages.login.signIn')"
          :label="t('pages.login.signIn')"
          :disabled="isLoading"
          outer-class="$reset grow"
          input-class="w-full"
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
          url="forgot-password"
          class="btn-text"
        >
          {{ t('pages.login.forgot') }}
        </RouteLink>
      </div>
    </section>
  </NuxtLayout>
</template>
