<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

definePageMeta({ middleware: ['abort-authenticated'] })
useSeo('Log in')

const { login } = useAuthentication()
const localePath = useLocalePath()
const redirect = useCookie<string>('sb-redirect-path')

const formSchema = toTypedSchema(z.object({
  email: z.string().min(5).max(50).email(),
  password: z.string().min(6).max(50),
}))

const form = useForm({
  validationSchema: formSchema,
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  try {
    await login(values)

    setTimeout(() => {
      const route = redirect.value || '/'

      if (redirect.value) redirect.value = ''

      navigateTo(localePath(route))
    }, 100)
  }
  catch (err: any) {
    formError.value = err.message || 'An error occurred during login'
  }
})
</script>

<template>
  <NuxtLayout name="auth">
    <h1 class="text-center head-3 mb-6">
      {{ $t('pages.login.title') }}
    </h1>

    <UiFormWrapper @submit="onSubmit">
      <UiFormField
        v-slot="{ componentField }"
        name="email"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel required>
            {{ $t('components.inputs.emailLabel') }}
          </UiFormLabel>
          <UiFormControl>
            <UiInput
              type="email"
              v-bind="componentField"
            />
          </UiFormControl>
          <UiFormMessage />
        </UiFormItem>
      </UiFormField>
      <PasswordToggle />
      <div
        v-if="formError"
        class="text-sm text-destructive"
      >
        {{ formError }}
      </div>
      <UiButton
        type="submit"
        class="w-full"
      >
        {{ $t('pages.login.signIn') }}
      </UiButton>
    </UiFormWrapper>

    <UiSeparator
      class="mt-6 mb-2"
      :label="$t('general.or')"
    />

    <div class="flex flex-wrap gap-2 justify-center">
      <NuxtLinkLocale
        to="/register"
        class="btn-text flex-1 grow"
      >
        {{ $t('pages.login.new') }}
      </NuxtLinkLocale>
      <UiSeparator
        orientation="vertical"
        class="h-8"
      />
      <NuxtLinkLocale
        to="/forgot-password"
        class="btn-text flex-1 grow"
      >
        {{ $t('pages.login.forgot') }}
      </NuxtLinkLocale>
    </div>

    <template #right>
      <ClientOnly>
        <UiIconCloud
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
