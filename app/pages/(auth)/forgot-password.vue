<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

import { useToast } from '~/components/ui/toast/use-toast'

definePageMeta({ middleware: ['abort-authenticated'] })
useSeo('Forgot password')

const { t } = useI18n()
const { toast } = useToast()
const localePath = useLocalePath()
const supabase = useSupabaseClient<DB>()

const formSchema = toTypedSchema(z.object({
  email: z.string().min(5).max(50).email(),
}))

const form = useForm({
  validationSchema: formSchema,
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw createError(error)

    toast({
      title: t('pages.forgotPassword.toast.success.title'),
      description: t('pages.forgotPassword.toast.success.text'),
      variant: 'success',
    })

    navigateTo(localePath('/login'))
  }
  catch (err: any) {
    formError.value = err.message || 'An error occurred during password reset'

    toast({
      title: t('general.error.title'),
      description: t('general.error.text'),
      variant: 'destructive',
    })
  }
})
</script>

<template>
  <NuxtLayout name="auth">
    <h1 class="text-center head-3 mb-6">
      {{ $t('pages.forgotPassword.title') }}
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
        {{ $t('pages.forgotPassword.reset') }}
      </UiButton>
    </UiFormWrapper>

    <UiSeparator
      class="mt-6 mb-2"
      :label="$t('general.or')"
    />

    <div class="flex flex-wrap gap-2 justify-center">
      <UiButton
        as-child
        variant="link"
        class="flex-1 grow"
      >
        <NuxtLinkLocale to="/register">
          {{ $t('pages.login.new') }}
        </NuxtLinkLocale>
      </UiButton>
      <UiSeparator
        orientation="vertical"
        class="h-8"
      />
      <UiButton
        as-child
        variant="link"
        class="flex-1 grow"
      >
        <NuxtLinkLocale to="/forgot-password">
          {{ $t('pages.login.forgot') }}
        </NuxtLinkLocale>
      </UiButton>
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
