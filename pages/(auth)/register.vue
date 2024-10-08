<script setup lang="ts">
definePageMeta({ middleware: ['abort-authenticated'] })
useHead({ title: 'Register' })

const { t } = useI18n()
const auth = useAuth()
const toast = useToast()
const localePath = useLocalePath()

const image = ref<string>(
  `https://api.dicebear.com/7.x/open-peeps/svg?seed=${(Math.random() + 1).toString(36).substring(7)}&size=100`,
)

async function register(form: Register, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    await auth.register({ ...form, avatar: image.value })

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

function randomAvatar(): void {
  image.value = `https://api.dicebear.com/7.x/open-peeps/svg?seed=${(Math.random() + 1)
    .toString(36)
    .substring(7)}&size=100`
}

function handleIconClick(node: any) {
  node.props.suffixIcon = node.props.suffixIcon === 'eye' ? 'eyeClosed' : 'eye'
  node.props.type = node.props.type === 'password' ? 'text' : 'password'
}
</script>

<template>
  <NuxtLayout name="centered">
    <section class="space-y-6">
      <h1 class="text-center">
        {{ t('pages.register.register') }}
      </h1>
      <div class="flex flex-col gap-2 items-center">
        <div class="w-[100px] h-[100px]">
          <img
            v-if="image"
            :src="image"
            loading="eager"
            alt="Avatar"
            class="w-full h-full"
          >
        </div>
        <button
          class="btn-text"
          :aria-label="t('pages.register.random')"
          @click="randomAvatar"
        >
          {{ t('pages.register.random') }}
        </button>
      </div>
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
          @suffix-icon-click="handleIconClick"
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
    </section>
  </NuxtLayout>
</template>
