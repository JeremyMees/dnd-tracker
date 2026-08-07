<script setup lang="ts">
import { useForm } from 'vee-validate'
import * as z from 'zod'

definePageMeta({ middleware: ['abort-authenticated'] })
useSeo('Log in')

const { login } = useAuthentication()
const localePath = useLocalePath()
const redirect = useCookie<string>('sb-redirect-path')

const formSchema = z.object({
  email: z.email().min(5).max(50),
  password: z.string().min(6).max(50),
})

const form = useForm({
  validationSchema: formSchema,
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async values => {
  formError.value = ''

  try {
    await login(values)

    setTimeout(() => {
      const route = redirect.value || '/'

      if (redirect.value) redirect.value = ''

      navigateTo(localePath(route))
    }, 100)
  } catch (err) {
    formError.value = getErrorMessage(err) || 'An error occurred during login'
  }
})
</script>

<template>
  <NuxtLayout name="auth">
    <h1 test-id="title" class="text-center head-3 mb-6">
      {{ $t('pages.login.title') }}
    </h1>

    <UiFormWrapper @submit="onSubmit">
      <UiFormField v-slot="{ componentField }" name="email">
        <UiFormItem v-auto-animate>
          <UiFormLabel required>
            {{ $t('components.inputs.emailLabel') }}
          </UiFormLabel>
          <UiFormControl>
            <UiInput test-id="email" type="email" v-bind="componentField" />
          </UiFormControl>
          <UiFormMessage />
        </UiFormItem>
      </UiFormField>
      <FormPasswordToggle />
      <div v-if="formError" test-id="error" class="text-sm text-destructive">
        {{ formError }}
      </div>
      <UiButton test-id="submit" type="submit" class="w-full">
        {{ $t('pages.login.signIn') }}
      </UiButton>
    </UiFormWrapper>

    <UiSeparator class="mt-6 mb-2" :label="$t('general.or')" />

    <div class="flex flex-wrap gap-2 justify-center">
      <UiButton as-child variant="link" class="flex-1 grow">
        <NuxtLinkLocale test-id="register" to="/register">
          {{ $t('pages.login.new') }}
        </NuxtLinkLocale>
      </UiButton>
      <UiSeparator orientation="vertical" class="h-8" />
      <UiButton as-child variant="link" class="flex-1 grow">
        <NuxtLinkLocale test-id="forgot" to="/forgot-password">
          {{ $t('pages.login.forgot') }}
        </NuxtLinkLocale>
      </UiButton>
    </div>

    <template #right>
      <ClientOnly>
        <UiIconCloud
          test-id="icon-cloud"
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
