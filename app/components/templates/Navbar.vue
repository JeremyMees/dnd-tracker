<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { navigationMenuTriggerStyle, navigationMenuContentStyle } from '~/components/ui/navigation-menu'

const { user, logout } = useAuthentication()
const { playRoutes, routes, profileRoutes } = useUi()
const { toast } = useToast()
const { t } = useI18n()
const localePath = useLocalePath()
const isSmall = useMediaQuery('(max-width: 1024px)')

const isOpen = ref<boolean>(false)
const isScrolled = ref<boolean>(false)

watch(isSmall, (v: boolean) => {
  if (!v && isOpen.value) isOpen.value = false
})

onMounted(() => {
  window.onscroll = function () {
    isScrolled.value = window.scrollY > 10
  }
})

onBeforeUnmount(() => {
  window.onscroll = null
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
  <nav
    :class="[
      isScrolled ? 'bg-background/80 backdrop-blur-lg' : 'bg-transparent backdrop-blur-none',
      'transition-all duration-500',
    ]"
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
        <div class="hidden md:flex items-center gap-4">
          <ClientOnly>
            <UiNavigationMenu disable-pointer-leave-close>
              <UiNavigationMenuList>
                <UiNavigationMenuItem
                  v-for="route in routes"
                  :key="route.label"
                >
                  <NuxtLink
                    v-slot="{ isActive, href, navigate }"
                    :to="localePath(route.url)"
                    custom
                  >
                    <UiNavigationMenuLink
                      :active="isActive"
                      :href="href"
                      :class="navigationMenuTriggerStyle()"
                      @click="navigate"
                    >
                      {{ $t(route.label) }}
                    </UiNavigationMenuLink>
                  </NuxtLink>
                </UiNavigationMenuItem>
                <UiNavigationMenuItem>
                  <UiNavigationMenuTrigger
                    class="mx-1 border-primary border-4 py-1 bg-primary/50 focus:bg-primary hover:bg-primary/60 data-active:bg-primary/50 data-[state=open]:hover:bg-primary/50 data-[state=open]:focus:bg-primary/50 data-[state=open]:bg-primary/50"
                  >
                    {{ $t('components.navbar.play') }}
                  </UiNavigationMenuTrigger>
                  <UiNavigationMenuContent class="flex flex-col p-2 w-[300px]!">
                    <NuxtLink
                      v-for="route in playRoutes"
                      v-slot="{ isActive, href, navigate }"
                      :key="route.label"
                      :to="localePath(route.url)"
                      custom
                    >
                      <UiNavigationMenuLink
                        :active="isActive"
                        :href="href"
                        class="flex flex-row gap-2 items-center w-full"
                        @click="navigate"
                      >
                        <Icon
                          v-if="route.icon"
                          :name="route.icon"
                          class="size-4 min-w-4"
                        />
                        {{ $t(route.label) }}
                      </UiNavigationMenuLink>
                    </NuxtLink>
                  </UiNavigationMenuContent>
                </UiNavigationMenuItem>
                <UiNavigationMenuItem>
                  <UiNavigationMenuTrigger
                    :icon="false"
                    :styled="false"
                    class="size-12"
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
                  </UiNavigationMenuTrigger>
                  <UiNavigationMenuContent class="flex flex-col py-2 w-[300px]!">
                    <template
                      v-for="route in profileRoutes"
                      :key="route.label"
                    >
                      <NuxtLink
                        v-if="route.requireAuth ? !!user : true"
                        v-slot="{ isActive, href, navigate }"
                        :to="localePath(route.url)"
                        custom
                      >
                        <UiNavigationMenuLink
                          :active="isActive"
                          :href="href"
                          class="flex flex-row gap-2 items-center"
                          @click="navigate"
                        >
                          <Icon
                            v-if="route.icon"
                            :name="route.icon"
                            class="size-4 min-w-4"
                          />
                          {{ $t(route.label) }}
                        </UiNavigationMenuLink>
                      </NuxtLink>
                    </template>
                    <UiDropdownMenuSeparator />
                    <YbugButton
                      type="menu"
                      :class="navigationMenuContentStyle()"
                    />
                    <UiDropdownMenuSeparator />
                    <div class="pl-2 py-[6px] space-y-2">
                      <LangSwitcher />
                      <ColorModeSwitcher />
                    </div>
                    <template v-if="user">
                      <UiDropdownMenuSeparator />
                      <button
                        class="text-destructive flex items-center gap-2"
                        :class="navigationMenuContentStyle()"
                        @click="logoutUser"
                      >
                        <Icon
                          name="tabler:logout"
                          class="size-3 min-w-3"
                        />
                        {{ $t('components.navbar.logout') }}
                      </button>
                    </template>
                  </UiNavigationMenuContent>
                </UiNavigationMenuItem>
              </UiNavigationMenuList>
            </UiNavigationMenu>
          </ClientOnly>
        </div>
        <ClientOnly>
          <UiDropdownMenu>
            <UiDropdownMenuTrigger class="md:hidden">
              <UiButton
                size="icon"
                aria-label="Open menu"
              >
                <Icon name="tabler:menu-2" />
              </UiButton>
            </UiDropdownMenuTrigger>
            <UiDropdownMenuContent
              class="w-60"
              align="end"
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
</template>
