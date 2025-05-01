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
  <NuxtLayout name="auth">
    <h1 class="text-center head-3 mb-4">
      {{ $t('pages.login.title') }}
    </h1>

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

    <UiSeparatorBase
      class="mt-6 mb-4"
      :label="$t('general.or')"
    />

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

    <template #right>
      <ClientOnly>
        <UiIconCloudBase
          :images="[
            'https://ik.imagekit.io/c2es1qasw/pixel-d4.png',
            'https://ik.imagekit.io/c2es1qasw/pixel-d6.png',
            'https://ik.imagekit.io/c2es1qasw/pixel-d8.png',
            'https://ik.imagekit.io/c2es1qasw/pixel-d10.png',
            'https://ik.imagekit.io/c2es1qasw/pixel-d12.png',
            'https://ik.imagekit.io/c2es1qasw/pixel-d20.png',
            'https://ik.imagekit.io/c2es1qasw/pixel-d4.png',
            'https://ik.imagekit.io/c2es1qasw/pixel-d6.png',
            'https://ik.imagekit.io/c2es1qasw/pixel-d8.png',
            'https://ik.imagekit.io/c2es1qasw/pixel-d10.png',
            'https://ik.imagekit.io/c2es1qasw/pixel-d12.png',
            'https://ik.imagekit.io/c2es1qasw/pixel-d20.png',
            'https://ik.imagekit.io/c2es1qasw/pixel-d4.png',
            'https://ik.imagekit.io/c2es1qasw/pixel-d6.png',
            'https://ik.imagekit.io/c2es1qasw/pixel-d8.png',
            'https://ik.imagekit.io/c2es1qasw/pixel-d10.png',
            'https://ik.imagekit.io/c2es1qasw/pixel-d12.png',
            'https://ik.imagekit.io/c2es1qasw/pixel-d20.png',
          ]"
        />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
