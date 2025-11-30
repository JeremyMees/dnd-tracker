<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { useProfileUpdate, useProfileRemove } from '~~/queries/profiles'

definePageMeta({ auth: true })
useSeo('Profile')

const user = useAuthenticatedUser()
const { toast } = useToast()
const { t } = useI18n()
const { ask } = useConfirm()
const localePath = useLocalePath()

const avatar = ref<Avatar>({
  url: user.value.avatar || '',
  extra: user.value.avatar_options || {},
})

const { mutateAsync: updateProfile } = useProfileUpdate()
const { mutateAsync: removeProfile } = useProfileRemove()

async function updateAvatar(avatar: Avatar): Promise<void> {
  return handleUpdateProfile({
    avatar: avatar.url,
    avatar_options: avatar.extra as Record<string, string | number>,
  })
}

const handleUpdateProfile = useThrottleFn(async (data: ProfileUpdate & { password?: string }): Promise<void> => {
  await updateProfile({
    data,
    id: user.value.id,
    onSuccess: () => {
      toast({
        description: t('pages.profile.toast.success.text'),
        variant: 'success',
      })
    },
    onError: (error) => {
      const message = error === 'New password should be different from the old password.'
        ? t('pages.profile.password.same')
        : error

      toast({
        title: t('general.error.title'),
        description: error || t('general.error.text'),
        variant: 'destructive',
      })

      throw new Error(message)
    },
  })
}, 1000)

async function handleRemoveUser(): Promise<void> {
  ask({
    title: t('pages.profile.dialog.delete.title'),
    description: t('pages.profile.dialog.delete.text'),
  }, async (confirmed: boolean) => {
    if (!confirmed) return

    await removeProfile({
      id: user.value.id,
      onSuccess: () => {
        navigateTo(localePath('/'))

        toast({
          description: t('pages.profile.toast.delete.text'),
          variant: 'success',
        })
      },
      onError: () => {
        toast({
          title: t('general.error.title'),
          description: t('general.error.text'),
          variant: 'destructive',
        })
      },
    })
  })
}
</script>

<template>
  <NuxtLayout container>
    <section class="space-y-2 relative">
      <div class="flex flex-wrap justify-center gap-y-2 gap-x-4 pb-6">
        <AvatarPicker
          v-model="avatar"
          profile
          :deprecated-avatar="!user.avatar_options"
          @save="updateAvatar"
        />
      </div>
      <UiSeparator />
      <div class="flex flex-wrap gap-4 items-center justify-between py-6">
        <div class="flex gap-4">
          {{ $t('pages.profile.subscription.current') }}:
          <span class="font-bold capitalize">
            {{ user.subscription_type }}
          </span>
        </div>
      </div>
      <UiSeparator />
      <div class="flex flex-col md:flex-row justify-between gap-x-10 gap-y-4 py-6">
        <div class="md:min-w-[300px] flex-1">
          <h2>
            {{ $t('pages.profile.data.title') }}
          </h2>
          <p class="pt-2 text-muted-foreground">
            {{ $t('pages.profile.data.subtitle') }}
          </p>
        </div>
        <div class="md:max-w-md flex-1">
          <FormProfileData
            :update="handleUpdateProfile"
            :initial-values="{
              name: user.name || 'tester',
              username: user.username || '',
              email: user.email || '',
              marketing: user.marketing ?? true,
            }"
          />
        </div>
      </div>
      <UiSeparator />
      <div class="flex flex-col md:flex-row justify-between gap-x-10 gap-y-4 py-6">
        <div class="md:min-w-[300px] flex-1">
          <h2>
            {{ $t('pages.profile.password.title') }}
          </h2>
          <p class="pt-2 text-muted-foreground">
            {{ $t('pages.profile.password.subtitle') }}
          </p>
        </div>
        <div class="md:max-w-md flex-1">
          <FormProfilePassword :update="handleUpdateProfile" />
        </div>
      </div>
      <UiSeparator />
      <div class="flex flex-wrap gap-x-4 gap-y-2 pt-6 justify-end">
        <UiButton
          variant="destructive"
          :aria-label="$t('pages.profile.delete')"
          @click="handleRemoveUser"
        >
          {{ $t('pages.profile.delete') }}
        </UiButton>
      </div>
    </section>
  </NuxtLayout>
</template>
