<script setup lang="ts">
definePageMeta({ middleware: ['abort-authenticated'] })
useSeo('Log in')

const auth = useAuth()
const localePath = useLocalePath()
const redirect = useCookie<string>('sb-redirect-path')

async function login(form: Login, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    await auth.login(sanitizeForm<Login>(form))

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
    <section class="space-y-6">
      <h1 class="text-center">
        {{ $t('pages.login.title') }}
      </h1>
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
        @submit="login"
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
      <div class="flex flex-wrap gap-2 justify-center">
        <RouteLink
          url="register"
          class="btn-text"
        >
          {{ $t('pages.login.new') }}
        </RouteLink>
        <RouteLink
          url="forgot-password"
          class="btn-text"
        >
          {{ $t('pages.login.forgot') }}
        </RouteLink>
      </div>
    </section>
  </NuxtLayout>
</template>
