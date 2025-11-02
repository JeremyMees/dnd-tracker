<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { useToast } from '~/components/ui/toast/use-toast'
import { defaultAvatar } from '~~/constants/default-avatar'

definePageMeta({ middleware: ['abort-authenticated'] })
useSeo('Register')

const { t } = useI18n()
const { register } = useAuthentication()
const { toast } = useToast()
const localePath = useLocalePath()

const avatar = ref<Avatar>(defaultAvatar)

const formSchema = toTypedSchema(z.object({
  name: z.string().min(3).max(30).regex(alphaSpaces, t('zod.alphaSpaces')),
  username: z.string().min(5).max(50).regex(alphaSpaces, t('zod.alphaSpaces')),
  email: z.string().min(5).max(50).email(),
  password: z
    .string()
    .min(6)
    .max(50)
    .regex(containsLowercase, t('zod.containsLowercase'))
    .regex(containsUppercase, t('zod.containsUppercase'))
    .regex(containsNumber, t('zod.containsNumber'))
    .regex(containsSymbol, t('zod.containsSymbol'))
    .regex(allowedChars, t('zod.allowedChars')),
  marketing: z.boolean(),
}))

const form = useForm({
  validationSchema: formSchema,
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  if (!avatar.value) return

  try {
    await register({
      ...values,
      avatar: avatar.value.url,
      avatar_options: avatar.value.extra,
    })

    toast({
      title: t('pages.register.toast.success.title'),
      description: t('pages.register.toast.success.text'),
      variant: 'success',
    })

    navigateTo(localePath('/login'))
  }
  catch (err: any) {
    formError.value = err.message || 'An error occurred during registration'

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
    <h1 class="text-center head-3 pb-4">
      {{ $t('pages.register.register') }}
    </h1>

    <AvatarPicker
      v-model="avatar"
      hide-creator-toggle
      class="lg:hidden mb-6"
    />

    <UiFormWrapper @submit="onSubmit">
      <UiFormField
        v-slot="{ componentField }"
        name="name"
      >
        <UiFormItem>
          <UiFormLabel required>
            {{ $t('components.inputs.fullNameLabel') }}
          </UiFormLabel>
          <UiFormControl>
            <UiInput
              type="text"
              v-bind="componentField"
            />
          </UiFormControl>
          <UiFormMessage />
        </UiFormItem>
      </UiFormField>
      <UiFormField
        v-slot="{ componentField }"
        name="username"
      >
        <UiFormItem>
          <UiFormLabel required>
            {{ $t('components.inputs.usernameLabel') }}
          </UiFormLabel>
          <UiFormControl>
            <UiInput
              type="text"
              v-bind="componentField"
            />
          </UiFormControl>
          <UiFormMessage />
        </UiFormItem>
      </UiFormField>
      <UiFormField
        v-slot="{ componentField }"
        name="email"
      >
        <UiFormItem>
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
      <UiFormField
        v-slot="{ value, handleChange }"
        name="marketing"
      >
        <UiFormItem class="flex items-center gap-2">
          <UiFormControl>
            <UiSwitch
              class="mb-0"
              :model-value="value"
              @update:model-value="handleChange"
            />
          </UiFormControl>
          <UiFormLabel>
            {{ $t('components.inputs.marketingLabel') }}
          </UiFormLabel>
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
        {{ $t('pages.register.register') }}
      </UiButton>
    </UiFormWrapper>
    <p class="text-sm text-center text-muted-foreground my-4">
      {{ $t('pages.register.consent') }}
    </p>

    <UiSeparator
      class="mt-6 mb-2"
      :label="$t('general.or')"
    />

    <div class="flex flex-wrap gap-2 justify-center">
      <NuxtLinkLocale
        to="/login"
        class="btn-text flex-1 grow"
      >
        {{ $t('pages.login.signIn') }}
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
      <AvatarPicker
        v-model="avatar"
        hide-creator-toggle
        class="max-w-sm"
      />
    </template>
  </NuxtLayout>
</template>
