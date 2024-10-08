<script setup lang="ts">
import type { Dropdown } from '#components'

// const toast = useToastStore()
const profile = useProfile()
const ui = useUI()
const auth = useAuth()
const isSmall = useMediaQuery('(max-width: 1024px)')
const localePath = useLocalePath()
const { t } = useI18n()

const isOpen = ref<boolean>(false)
const navigationVisible = ref<boolean>(true)
const playDropdown = ref<InstanceType<typeof Dropdown>>()
const profileDropdown = ref<InstanceType<typeof Dropdown>>()

watch(isSmall, (v: boolean) => {
  if (!v && isOpen.value) isOpen.value = false
})

onMounted(() => {
  let prevScrollpos = window.scrollY

  window.onscroll = function () {
    const currentScrollPos = window.scrollY

    navigationVisible.value = (prevScrollpos > currentScrollPos && currentScrollPos !== 0) || currentScrollPos === 0

    if (!navigationVisible.value) {
      if (playDropdown.value) playDropdown.value.close()
      if (profileDropdown.value) profileDropdown.value.close()
    }

    prevScrollpos = currentScrollPos
  }
})

async function logout(): Promise<void> {
  if (profileDropdown.value) profileDropdown.value.close()

  // try {
  //   await auth.logout()
  //   profile.data = null
  //   isOpen.value = false
  // }
  // catch (err) {
  //   console.error(err)
  //   toast.error()
  // }
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
      v-show="ui.showNavigation && navigationVisible"
      class="bg-tracker/70 border-4 border-tracker m-4 rounded-lg"
    >
      <div class="container-max p-4 flex justify-between items-center gap-4">
        <NuxtLink :to="localePath('/')">
          <NuxtImg
            src="/logo.svg"
            alt="DnD Tracker logo"
            sizes="sm:500px md:500px lg:500px"
            class="h-16"
          />
        </NuxtLink>
        <div class="flex justify-end items-center gap-4">
          <div class="hidden lg:flex items-center gap-4">
            <RouteLink
              v-for="link in ui.routes"
              :key="link.url"
              :label="t(link.label)"
              :url="link.url"
            />
          </div>
          <div class="hidden md:flex items-center gap-4">
            <Dropdown
              ref="playDropdown"
              chevron
            >
              {{ t('components.navbar.play') }}
              <template #content>
                <RouteLink
                  v-for="route in ui.playRoutes"
                  :key="route.label"
                  :url="route.url"
                  class="hover:text-white"
                  @click="isOpen = false"
                >
                  {{ t(route.label) }}
                </RouteLink>
              </template>
            </Dropdown>
            <Dropdown
              v-show="auth.isAuthenticated"
              ref="profileDropdown"
              color="secondary"
              round
            >
              <AnimationReveal class="flex flex-col">
                <img
                  v-if="profile.data?.avatar"
                  :src="profile.data.avatar"
                  alt="Avatar image"
                  class="w-10 p-1 -scale-x-100"
                >
                <Icon
                  v-else
                  name="material-symbols:person"
                  class="w-6 h-6 text-slate-300 animate-pulse"
                  aria-hidden="true"
                />
              </AnimationReveal>
              <template #content>
                <RouteLink
                  v-for="route in ui.profileRoutes"
                  :key="route.url"
                  :label="t(route.label)"
                  :url="route.url"
                  @click="isOpen = false"
                />
                <button
                  v-if="auth.isAuthenticated"
                  class="text-warning hover:text-white max-w-max font-bold"
                  @click="logout"
                >
                  {{ t('components.navbar.logout') }}
                </button>
              </template>
            </Dropdown>
            <LangSwitcher />
          </div>
          <button
            class="lg:hidden h-12 flex flex-col items-center justify-center"
            aria-label="Open menu"
            aria-haspopup="true"
            @click="isOpen = true"
          >
            <Icon
              name="ci:hamburger-lg"
              class="w-8 h-8 min-w-[2rem] text-white"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
      <Teleport to="body">
        <AnimationSlideIn>
          <NavbarPopup
            v-if="isOpen"
            :routes="ui.routes"
            :drop-down-routes="[...ui.playRoutes, ...ui.profileRoutes]"
            :authenticated="auth.isAuthenticated"
            @logout="logout"
            @close="isOpen = false"
          />
        </AnimationSlideIn>
      </Teleport>
    </nav>
  </Transition>
</template>
