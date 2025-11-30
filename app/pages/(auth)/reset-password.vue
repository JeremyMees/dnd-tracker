<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { toTypedSchema } from '@vee-validate/zod'
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

const formSchema = toTypedSchema(z.object({
  password: z
    .string()
    .min(6)
    .max(50)
    .regex(containsLowercase, t('zod.containsLowercase'))
    .regex(containsUppercase, t('zod.containsUppercase'))
    .regex(containsNumber, t('zod.containsNumber'))
    .regex(containsSymbol, t('zod.containsSymbol'))
    .regex(allowedChars, t('zod.allowedChars')),
}))

const form = useForm({
  validationSchema: formSchema,
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  try {
    const { error } = await supabase.auth.updateUser({ password: values.password })

    if (error) throw createError(error)

    toast({
      description: t('pages.resetPassword.toast.success.text'),
      variant: 'success',
    })

    navigateTo(localePath('/'))
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
    <h1 class="text-center mb-6 head-3">
      {{ $t('pages.resetPassword.title') }}
    </h1>

    <UiFormWrapper @submit="onSubmit">
      <FormPasswordToggle />
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
        {{ $t('pages.resetPassword.reset') }}
      </UiButton>
    </UiFormWrapper>

    <UiButton
      variant="destructive-ghost"
      as-child
      class="w-full mt-2"
    >
      <NuxtLinkLocale to="/">
        {{ $t('actions.cancel') }}
      </NuxtLinkLocale>
    </UiButton>

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
