<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'

defineProps<{ routes: Route[] }>()

const { toast } = useToast()
const { t } = useI18n()
const profile = useProfile()
const auth = useAuth()
const localePath = useLocalePath()

async function logout(): Promise<void> {
  try {
    await auth.logout()
    profile.data = undefined

    setTimeout(() => navigateTo(localePath('/')), 100)
  }
  catch (err) {
    toast({
      title: t('general.error.title'),
      description: t('general.error.text'),
      variant: 'destructive',
    })
  }
}
</script>

<template>
  <UiDropdownMenuContent>
    <template
      v-for="route in routes"
      :key="route.label"
    >
      <UiDropdownMenuItem v-if="route.requireAuth ? auth.isAuthenticated : true">
        <NuxtLinkLocale
          :to="route.url"
          class="flex items-center gap-2"
        >
          <Icon
            v-if="route.icon"
            :name="route.icon"
            class="size-4 min-w-4"
          />
          {{ $t(route.label) }}
        </NuxtLinkLocale>
      </UiDropdownMenuItem>
    </template>
    <UiDropdownMenuSeparator />
    <div class="px-2 py-[6px] space-y-2">
      <LangSwitcher />
      <ColorModeSwitcher />
    </div>
    <template v-if="auth.isAuthenticated">
      <UiDropdownMenuSeparator />
      <UiDropdownMenuItem>
        <button
          class="text-destructive flex items-center gap-2"
          @click="logout"
        >
          <Icon
            name="tabler:logout"
            class="size-4 min-w-4"
          />
          {{ $t('components.navbar.logout') }}
        </button>
      </UiDropdownMenuItem>
    </template>
  </UiDropdownMenuContent>
</template>
