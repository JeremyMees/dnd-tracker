<script setup lang="ts">
defineEmits(['logout', 'close'])
defineProps<{
  routes: Route[]
  dropDownRoutes: Route[]
  authenticated: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <div
    class="fixed inset-0 flex flex-col overflow-x-hidden overflow-y-auto bg-bg-light p-4 z-20"
  >
    <div class="flex justify-between items-center gap-4 pb-10">
      <NuxtLinkLocale
        to="/"
        @click="$emit('close')"
      >
        <NuxtImg
          src="/logo.svg"
          alt="DnD Tracker logo"
          sizes="sm:500px md:500px lg:500px"
          class="h-16"
        />
      </NuxtLinkLocale>
      <button
        :aria-label="t('actions.close')"
        @click="$emit('close')"
      >
        <Icon
          name="tabler:x"
          class="w-10 h-10 text-danger"
          aria-hidden="true"
        />
      </button>
    </div>
    <div class="flex flex-col gap-y-2 pt-4">
      <div
        v-show="!authenticated"
        class="flex flex-col gap-y-2"
      >
        <RouteLink
          :label="t('components.navbar.login')"
          url="login"
          @click="$emit('close')"
        />
        <RouteLink
          :label="t('components.navbar.register')"
          url="register"
          @click="$emit('close')"
        />
      </div>
      <RouteLink
        v-for="route in routes"
        :key="route.url"
        :label="t(route.label)"
        :url="route.url"
        @click="$emit('close')"
      />
      <RouteLink
        v-for="route in dropDownRoutes"
        :key="route.url"
        :label="t(route.label)"
        :url="route.url"
        @click="$emit('close')"
      />
      <div
        v-show="authenticated"
        class="text-danger hover:text-white cursor-pointer duration-200 ease-in-out max-w-max font-bold pt-4"
        @click="$emit('logout')"
      >
        {{ t('components.navbar.logout') }}
      </div>
    </div>
  </div>
</template>
