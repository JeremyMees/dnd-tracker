<script setup lang="ts">
definePageMeta({ middleware: ['abort-authenticated'] })
useHead({ title: 'Register' })

const { t } = useI18n()
const auth = useAuth()
const toast = useToast()
const localePath = useLocalePath()

const avatar = ref<Avatar>()

async function register(form: Register, node: FormNode): Promise<void> {
  node.clearErrors()

  if (!avatar.value) return

  try {
    await auth.register({
      ...form,
      avatar: avatar.value.url,
      avatar_options: avatar.value.extra,
    })

    toast.success({
      title: t('pages.register.toast.success.title'),
      text: t('pages.register.toast.success.text'),
    })

    navigateTo(localePath('/login'))
  }
  catch (err: any) {
    node.setErrors(err.message)
    toast.error()
  }
}

function togglePasswordInput(node: any): void {
  node.props.suffixIcon = node.props.suffixIcon === 'eye' ? 'eyeClosed' : 'eye'
  node.props.type = node.props.type === 'password' ? 'text' : 'password'
}
</script>

<template>
  <NuxtLayout
    name="centered"
    wide
  >
    <section class="space-y-6">
      <h1 class="text-center">
        {{ t('pages.register.register') }}
      </h1>
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
            :submit-label="t('pages.register.register')"
            @submit="register"
          >
            <FormKit
              name="name"
              :label="t('components.inputs.fullNameLabel')"
              validation="required|length:3,30|alpha_spaces"
            />
            <FormKit
              name="username"
              :label="t('components.inputs.usernameLabel')"
              validation="required|length:3,15|alpha_spaces"
            />
            <FormKit
              name="email"
              :label="t('components.inputs.emailLabel')"
              validation="required|length:5,50|email"
            />
            <FormKit
              name="password"
              type="password"
              suffix-icon="eye"
              :label="t('components.inputs.passwordLabel')"
              validation="required|length:6,50|contains_lowercase|contains_uppercase|contains_alpha|contains_numeric|contains_symbol"
              @suffix-icon-click="togglePasswordInput"
            />
            <FormKit
              name="marketing"
              type="toggle"
              :value="true"
              :label="t('components.inputs.marketingLabel')"
            />
          </FormKit>
          <p class="body-small text-center">
            {{ t('pages.register.consent') }}
          </p>
          <div class="flex flex-wrap gap-2 justify-center">
            <RouteLink
              url="login"
              class="btn-text"
            >
              {{ t('pages.login.signIn') }}
            </RouteLink>
            <RouteLink
              url="forgot-password"
              class="btn-text"
            >
              {{ t('pages.login.forgot') }}
            </RouteLink>
          </div>
        </div>
      </div>
    </section>
  </NuxtLayout>
</template>
