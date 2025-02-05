<script setup lang="ts">
definePageMeta({ middleware: ['abort-authenticated'] })
useSeo('Log in')

const { login } = useAuthentication()
const localePath = useLocalePath()
const redirect = useCookie<string>('sb-redirect-path')

async function handleLogin(form: Login, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    await login(sanitizeForm<Login>(form))

    setTimeout(() => {
      const route = redirect.value || '/'

      if (redirect.value) redirect.value = ''

      navigateTo(localePath(route))
    }, 100)
  }
  catch (err: any) {
    node.setErrors(err.message)
  }
}
</script>

<template>
  <NuxtLayout name="centered">
    <template #header>
      <h1 class="text-center">
        {{ $t('pages.login.title') }}
      </h1>
    </template>

    <NuxtImg
      src="/classes.png"
      alt="DnD Classes"
      :width="250"
      :height="250"
      class="mx-auto visibility-pulse"
    />
    <FormKit
      type="form"
      :submit-label="$t('pages.login.signIn')"
      @submit="handleLogin"
    >
      <FormKit
        name="email"
        :label="$t('components.inputs.emailLabel')"
        validation="required|length:5,50|email"
      />
      <FormKit
        name="password"
        type="password"
        :label="$t('components.inputs.passwordLabel')"
        validation="required|length:6,50"
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
          to="/forgot-password"
          class="btn-text"
        >
          {{ $t('pages.login.forgot') }}
        </NuxtLinkLocale>
      </div>
    </template>
  </NuxtLayout>
</template>
