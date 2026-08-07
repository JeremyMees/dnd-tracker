<script setup lang="ts">
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

const formSchema = z.object({
  name: z
    .string()
    .min(3)
    .max(30)
    .regex(alphaSpaces, { error: () => t('zod.alphaSpaces') }),
  username: z
    .string()
    .min(5)
    .max(50)
    .regex(alphaSpaces, { error: () => t('zod.alphaSpaces') }),
  email: z.email().min(5).max(50),
  password: z
    .string()
    .min(6)
    .max(50)
    .regex(containsLowercase, { error: () => t('zod.containsLowercase') })
    .regex(containsUppercase, { error: () => t('zod.containsUppercase') })
    .regex(containsNumber, { error: () => t('zod.containsNumber') })
    .regex(containsSymbol, { error: () => t('zod.containsSymbol') })
    .regex(allowedChars, { error: () => t('zod.allowedChars') }),
  marketing: z.boolean(),
})

const form = useForm({
  validationSchema: formSchema,
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async values => {
  formError.value = ''

  if (!avatar.value) return

  try {
    await register({
      ...values,
      avatar: avatar.value.url,
      avatarOptions: avatar.value.extra,
    })

    toast({
      title: t('pages.register.toast.success.title'),
      description: t('pages.register.toast.success.text'),
      variant: 'success',
    })

    navigateTo(localePath('/login'))
  } catch (err) {
    formError.value =
      getErrorMessage(err) || 'An error occurred during registration'

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
    <h1 test-id="title" class="text-center head-3 pb-4">
      {{ $t('pages.register.register') }}
    </h1>

    <LazyAvatarPicker
      v-model="avatar"
      hydrate-on-visible
      hide-creator-toggle
      class="lg:hidden mb-6"
    />

    <UiFormWrapper @submit="onSubmit">
      <UiFormField v-slot="{ componentField }" name="name">
        <UiFormItem v-auto-animate>
          <UiFormLabel required>
            {{ $t('components.inputs.fullNameLabel') }}
          </UiFormLabel>
          <UiFormControl>
            <UiInput test-id="name" type="text" v-bind="componentField" />
          </UiFormControl>
          <UiFormMessage />
        </UiFormItem>
      </UiFormField>
      <UiFormField v-slot="{ componentField }" name="username">
        <UiFormItem v-auto-animate>
          <UiFormLabel required>
            {{ $t('components.inputs.usernameLabel') }}
          </UiFormLabel>
          <UiFormControl>
            <UiInput test-id="username" type="text" v-bind="componentField" />
          </UiFormControl>
          <UiFormMessage />
        </UiFormItem>
      </UiFormField>
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
      <UiFormField v-slot="{ value, handleChange }" name="marketing">
        <UiFormItem v-auto-animate class="flex items-center gap-2">
          <UiFormControl>
            <UiSwitch
              test-id="marketing"
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
      <div v-if="formError" test-id="error" class="text-sm text-destructive">
        {{ formError }}
      </div>
      <UiButton test-id="submit" type="submit" class="w-full">
        {{ $t('pages.register.register') }}
      </UiButton>
    </UiFormWrapper>
    <p class="text-sm text-center text-muted-foreground my-4">
      {{ $t('pages.register.consent') }}
    </p>

    <UiSeparator class="mt-6 mb-2" :label="$t('general.or')" />

    <div class="flex flex-wrap gap-2 justify-center">
      <UiButton as-child variant="link" class="flex-1 grow">
        <NuxtLinkLocale test-id="login" to="/login">
          {{ $t('pages.login.signIn') }}
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
      <LazyAvatarPicker
        v-model="avatar"
        hydrate-on-visible
        hide-creator-toggle
        class="max-w-sm"
      />
    </template>
  </NuxtLayout>
</template>
