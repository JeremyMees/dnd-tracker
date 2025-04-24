<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { togglePasswordInput } from '~/utils/ui-helpers'

definePageMeta({ middleware: ['abort-authenticated'] })
useSeo('Register')

const { t } = useI18n()
const { register } = useAuthentication()
const { toast } = useToast()
const localePath = useLocalePath()

const avatar = ref<Avatar>()

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
  <NuxtLayout
    name="centered"
    wide
  >
    <template #header>
      <h1 class="text-center">
        {{ $t('pages.register.register') }}
      </h1>
    </template>

    <div class="flex flex-col lg:flex-row gap-x-6 gap-y-6">
      <AvatarPicker
        avatar-big
        hide-creator-toggle
        class="lg:max-w-[500px]"
        @change="avatar = $event"
      />
      <div class="flex-grow">
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
      </div>
    </div>

    <template #footer>
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
    </template>
  </NuxtLayout>
</template>
