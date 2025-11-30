<script setup lang="ts">
defineEmits<{ logout: [] }>()
defineProps<{ routes: Route[] }>()

const { user } = useAuthentication()
</script>

<template>
  <UiDropdownMenuContent>
    <template
      v-for="route in routes"
      :key="route.label"
    >
      <UiDropdownMenuItem v-if="route.requireAuth ? !!user : true">
        <NuxtLinkLocale
          :to="route.url"
          class="flex items-center gap-2 w-full"
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
          @click="$emit('logout')"
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
