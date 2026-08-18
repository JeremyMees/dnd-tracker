<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { useForm } from 'vee-validate'
import * as z from 'zod'

useSeo('Reset password')

const { t } = useI18n()
const { toast } = useToast()
const localePath = useLocalePath()
const route = useRoute()
const supabase = useSupabaseClient<DB>()

onMounted(() => checkIfError())

function checkIfError(): void {
  const { error } = route.query

  if (error) {
    navigateTo(localePath('/forgot-password'))

    toast({
      title: t('pages.resetPassword.toast.error.title'),
      description: t('pages.resetPassword.toast.error.text'),
      variant: 'destructive',
    })
  }
}

const formSchema = z.object({
  password: z
    .string()
    .min(6)
    .max(50)
    .regex(containsLowercase, { error: () => t('zod.containsLowercase') })
    .regex(containsUppercase, { error: () => t('zod.containsUppercase') })
    .regex(containsNumber, { error: () => t('zod.containsNumber') })
    .regex(containsSymbol, { error: () => t('zod.containsSymbol') })
    .regex(allowedChars, { error: () => t('zod.allowedChars') }),
})

const form = useForm({
  validationSchema: formSchema,
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async values => {
  formError.value = ''

  try {
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    })

    if (error) throw createError(error)

    toast({
      description: t('pages.resetPassword.toast.success.text'),
      variant: 'success',
    })

    navigateTo(localePath('/'))
  } catch (err) {
    formError.value =
      getErrorMessage(err) || 'An error occurred during password reset'

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
    <h1 test-id="title" class="text-center mb-6 head-3">
      {{ $t('pages.resetPassword.title') }}
    </h1>

    <UiFormWrapper @submit="onSubmit">
      <FormPasswordToggle />
      <div v-if="formError" test-id="error" class="text-sm text-destructive">
        {{ formError }}
      </div>
      <UiButton test-id="submit" type="submit" class="w-full">
        {{ $t('pages.resetPassword.reset') }}
      </UiButton>
    </UiFormWrapper>

    <UiButton variant="destructive-ghost" as-child class="w-full mt-2">
      <NuxtLinkLocale test-id="cancel" to="/">
        {{ $t('actions.cancel') }}
      </NuxtLinkLocale>
    </UiButton>

    <template #right>
      <ClientOnly>
        <UiIconCloud
          test-id="icon-cloud"
          :images="[
            '/d4.webp',
            '/d6.webp',
            '/d8.webp',
            '/d10.webp',
            '/d12.webp',
            '/d20.webp',
            '/d4.webp',
            '/d6.webp',
            '/d8.webp',
            '/d10.webp',
            '/d12.webp',
            '/d20.webp',
            '/d4.webp',
            '/d6.webp',
            '/d8.webp',
            '/d10.webp',
            '/d12.webp',
            '/d20.webp',
          ]"
        />
      </ClientOnly>
    </template>
  </NuxtLayout>
</template>
