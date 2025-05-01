<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'

const { user, logout } = useAuthentication()
const { playRoutes, routes, profileRoutes } = useUi()
const { toast } = useToast()
const { t } = useI18n()
const isSmall = useMediaQuery('(max-width: 1024px)')

const isOpen = ref<boolean>(false)
const navigationVisible = ref<boolean>(true)

watch(isSmall, (v: boolean) => {
  if (!v && isOpen.value) isOpen.value = false
})

onMounted(() => {
  let prevScrollpos = window.scrollY

  window.onscroll = function () {
    const currentScrollPos = window.scrollY
    navigationVisible.value = (prevScrollpos > currentScrollPos && currentScrollPos !== 0) || currentScrollPos === 0
    prevScrollpos = currentScrollPos
  }
})

async function logoutUser(): Promise<void> {
  try {
    await logout()
    isOpen.value = false
  }
  catch {
    toast({
      title: t('general.error.title'),
      description: t('general.error.text'),
      variant: 'destructive',
    })
  }
}
</script>

<template>
  <Transition
    enter-active-class="duration-300 delay-100 ease-out"
    enter-from-class="!-translate-y-[200%]"
    enter-to-class="!translate-y-0"
    leave-active-class="duration-300 delay-100 ease-in"
    leave-from-class="!translate-y-0"
    leave-to-class="!-translate-y-[200%]"
  >
    <nav
      v-show="navigationVisible"
      class="bg-muted/50 backdrop-blur-lg border-4 border-muted m-4 rounded-lg"
    >
      <div class="container-max p-4 flex justify-between items-center gap-4">
        <NuxtLinkLocale to="/">
          <NuxtImg
            src="/logo.svg"
            alt="DnD Tracker logo"
            width="356"
            height="125"
            sizes="sm:500px md:500px lg:500px"
            class="w-[150px]"
          />
        </NuxtLinkLocale>
        <div class="flex justify-end items-center gap-4">
          <div class="hidden lg:flex items-center gap-4">
            <NuxtLinkLocale
              v-for="link in routes"
              :key="link.url"
              :to="link.url"
            >
              {{ $t(link.label) }}
            </NuxtLinkLocale>
            <UiDropdownMenu>
              <UiDropdownMenuTrigger class="btn-primary flex items-center gap-2">
                {{ $t('components.navbar.play') }}
                <Icon
                  name="tabler:chevron-down"
                  class="size-6 min-w-6"
                />
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent
                class="w-60"
                align="start"
              >
                <UiDropdownMenuItem
                  v-for="route in playRoutes"
                  :key="route.label"
                >
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
              </UiDropdownMenuContent>
            </UiDropdownMenu>
            <UiDropdownMenu>
              <UiDropdownMenuTrigger
                class="mt-1"
                aria-label="Profile menu"
              >
                <UiAvatar
                  :class="[user ? 'border-tertiary' : 'border-muted-foreground']"
                  class="border-4"
                  size="base"
                >
                  <UiAvatarImage
                    :src="user?.avatar ?? ''"
                    alt="Avatar image"
                    class="scale-x-[-1]"
                  />
                  <UiAvatarFallback class="h-6">
                    <Icon
                      :name="user ? 'tabler:user' : 'tabler:settings'"
                      class="size-6 min-w-6 text-muted-foreground"
                    />
                  </UiAvatarFallback>
                </UiAvatar>
              </UiDropdownMenuTrigger>
              <ProfileMenu
                class="w-60"
                align="start"
                :routes="profileRoutes"
                @logout="logoutUser"
              />
            </UiDropdownMenu>
          </div>
          <ClientOnly>
            <UiDropdownMenu>
              <UiDropdownMenuTrigger class="lg:hidden">
                <button
                  class="text-foreground flex flex-col items-center justify-center"
                  aria-label="Open menu"
                >
                  <Icon
                    name="tabler:menu-2"
                    class="size-8 min-w-8"
                  />
                </button>
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent
                class="w-60"
                align="start"
              >
                <UiDropdownMenuItem
                  v-for="route in routes"
                  :key="route.label"
                >
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
                <UiDropdownMenuSeparator />
                <UiDropdownMenuItem
                  v-for="route in playRoutes"
                  :key="route.label"
                >
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
                <UiDropdownMenuSeparator />
                <template
                  v-for="route in profileRoutes"
                  :key="route.label"
                >
                  <UiDropdownMenuItem v-if="route.requireAuth ? !!user : true">
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
                <UiDropdownMenuItem as-child>
                  <YbugButton type="menu" />
                </UiDropdownMenuItem>
                <UiDropdownMenuSeparator />
                <div class="px-2 py-[6px] space-y-2">
                  <LangSwitcher />
                  <ColorModeSwitcher />
                </div>
                <template v-if="user">
                  <UiDropdownMenuSeparator />
                  <UiDropdownMenuItem>
                    <button
                      class="text-destructive flex items-center gap-2"
                      @click="logoutUser"
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
            </UiDropdownMenu>
          </ClientOnly>
        </div>
      </div>
    </nav>
  </Transition>
</template>
