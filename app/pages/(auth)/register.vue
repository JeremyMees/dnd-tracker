<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { togglePasswordInput } from '~/utils/ui-helpers'
import { defaultAvatar } from '~~/constants/default-avatar'

definePageMeta({ middleware: ['abort-authenticated'] })
useSeo('Register')

const { t } = useI18n()
const { register } = useAuthentication()
const { toast } = useToast()
const localePath = useLocalePath()

const avatar = ref<Avatar>(defaultAvatar)

async function handleRegister(form: Register, node: FormNode): Promise<void> {
  node.clearErrors()

  if (!avatar.value) return

  try {
    await register({
      ...form,
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
    node.setErrors(err.message)

    toast({
      title: t('general.error.title'),
      description: t('general.error.text'),
      variant: 'destructive',
    })
  }
}
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

    <FormKit
      type="form"
      :submit-label="$t('pages.register.register')"
      @submit="handleRegister"
    >
      <FormKit
        name="name"
        :label="$t('components.inputs.fullNameLabel')"
        validation="required|length:3,30|alpha_spaces"
      />
      <FormKit
        name="username"
        :label="$t('components.inputs.usernameLabel')"
        validation="required|length:3,15|alpha_spaces"
      />
      <FormKit
        name="email"
        :label="$t('components.inputs.emailLabel')"
        validation="required|length:5,50|email"
      />
      <FormKit
        name="password"
        type="password"
        suffix-icon="tabler:eye"
        :label="$t('components.inputs.passwordLabel')"
        validation="required|length:6,50|contains_lowercase|contains_uppercase|contains_alpha|contains_numeric|contains_symbol"
        @suffix-icon-click="togglePasswordInput"
      />
      <FormKit
        name="marketing"
        type="toggle"
        :value="true"
        :label="$t('components.inputs.marketingLabel')"
      />
    </FormKit>
    <p class="text-sm text-center text-muted-foreground my-4">
      {{ $t('pages.register.consent') }}
    </p>

    <UiSeparator
      class="mt-6 mb-4"
      :label="$t('general.or')"
    />

    <div class="flex flex-wrap gap-2 justify-center">
      <NuxtLinkLocale
        to="/login"
        class="btn-text"
      >
        {{ $t('pages.login.signIn') }}
      </NuxtLinkLocale>
      <NuxtLinkLocale
        to="/forgot-password"
        class="btn-text"
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
