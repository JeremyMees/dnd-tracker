<script setup lang="ts">
import { reset } from '@formkit/core'
import { useToast } from '~/components/ui/toast/use-toast'
import { togglePasswordInput } from '~/utils/ui-helpers'

definePageMeta({ auth: true })
useSeo('Profile')

const profile = useProfile()
const { toast } = useToast()
const { t } = useI18n()
const { ask } = useConfirm()
const localePath = useLocalePath()

const formInfo = ref<ProfileUpdate>({
  email: '',
  name: '',
  username: '',
  marketing: true,
})

if (profile.data) setUserData()
else whenever(() => profile.data, () => setUserData())

function setUserData(): void {
  formInfo.value = {
    email: profile.data?.email || '',
    name: profile.data?.name || '',
    username: profile.data?.username || '',
    marketing: profile.data?.marketing ?? true,
  } as ProfileUpdate
}

async function updateAvatar(avatar: Avatar): Promise<void> {
  return updateProfile({
    avatar: avatar.url,
    avatar_options: avatar.extra as Record<string, string | number>,
  })
}

const updateProfile = useThrottleFn(async (form: ProfileUpdate & { password?: string }, node?: FormNode): Promise<void> => {
  node?.clearErrors()

  try {
    const payload = sanitizeForm<ProfileUpdate & { password?: string }>(form)

    await profile.updateProfile(payload)

    toast({
      description: t('pages.profile.toast.success.text'),
      variant: 'success',
    })

    reset('password')
  }
  catch (err: any) {
    const message = err.message === 'New password should be different from the old password.'
      ? t('pages.profile.password.same')
      : err.message

    node?.setErrors(message)

    toast({
      description: message,
      variant: 'destructive',
    })
  }
}, 1000)

async function deleteUser(): Promise<void> {
  ask({
    title: t('pages.profile.dialog.delete.title'),
    description: t('pages.profile.dialog.delete.text'),
  }, async (confirmed: boolean) => {
    if (!confirmed) return

    try {
      await profile.deleteProfile()
      navigateTo(localePath('/'))

      toast({
        description: t('pages.profile.toast.delete.text'),
        variant: 'success',
      })
    }
    catch (err) {
      toast({
        title: t('general.error.title'),
        description: t('general.error.text'),
        variant: 'destructive',
      })
    }
  })
}
</script>

<template>
  <NuxtLayout container>
    <section class="space-y-2 relative">
      <div class="flex flex-wrap justify-center gap-y-2 gap-x-4 pb-6">
        <AvatarPicker
          profile
          avatar-big
          :deprecated-avatar="profile.data && !profile.data?.avatar_options"
          :selected-options="profile.data?.avatar_options as SelectedStyleOptions || undefined"
          @save="updateAvatar"
        />
      </div>
      <UiSeparator />
      <div class="flex flex-wrap gap-4 items-center justify-between py-6">
        <div class="flex gap-4">
          {{ $t('pages.profile.subscription.current') }}:
          <span
            v-if="profile.data"
            class="font-bold capitalize"
          >
            {{ profile.data.subscription_type }}
          </span>
          <UiSkeleton
            v-else
            class="w-10 h-6 rounded-full"
          />
        </div>
      </div>
      <UiSeparator />
      <div class="flex flex-col md:flex-row justify-between gap-x-10 gap-y-4 py-6">
        <div class="md:min-w-[300px]">
          <h2>
            {{ $t('pages.profile.data.title') }}
          </h2>
          <p class="pt-2">
            {{ $t('pages.profile.data.subtitle') }}
          </p>
        </div>
        <div class="grow md:max-w-xl">
          <FormKit
            v-model="formInfo"
            type="form"
            :submit-label="$t('actions.save')"
            @submit="updateProfile"
          >
            <FormKit
              name="name"
              :label="$t('components.inputs.nameLabel')"
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
              name="marketing"
              type="toggle"
              :label="$t('components.inputs.marketingLabel')"
            />
          </FormKit>
        </div>
      </div>
      <UiSeparator />
      <div class="flex flex-col md:flex-row justify-between gap-x-10 gap-y-4 py-6">
        <div class="md:min-w-[300px]">
          <h2>
            {{ $t('pages.profile.password.title') }}
          </h2>
          <p class="pt-2">
            {{ $t('pages.profile.password.subtitle') }}
          </p>
        </div>
        <div class="grow md:max-w-xl">
          <FormKit
            id="password"
            type="form"
            :submit-label="$t('actions.save')"
            @submit="updateProfile"
          >
            <FormKit
              name="password"
              type="password"
              suffix-icon="eye"
              :label="$t('components.inputs.passwordLabel')"
              validation="required|length:6,50|contains_lowercase|contains_uppercase|contains_alpha|contains_numeric|contains_symbol"
              @suffix-icon-click="togglePasswordInput"
            />
          </FormKit>
        </div>
      </div>
      <UiSeparator />
      <div class="flex flex-wrap gap-x-4 gap-y-2 pt-6 justify-end">
        <button
          v-if="profile.data"
          class="btn-destructive"
          :aria-label="$t('pages.profile.delete')"
          @click="deleteUser"
        >
          {{ $t('pages.profile.delete') }}
        </button>
        <UiSkeleton
          v-else
          class="h-12 rounded-lg w-[200px]"
        />
      </div>
    </section>
  </NuxtLayout>
</template>
