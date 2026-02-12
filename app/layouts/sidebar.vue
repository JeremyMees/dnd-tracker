<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'

defineProps<{
  header?: string
  onlyProvidedContent?: boolean
}>()

const { user, logout } = useAuthentication()
const route = useRoute()
const { playRoutes, routes, profileRoutes, homeRoute } = useUi()
const { toast } = useToast()
const { t } = useI18n()
const sidebar = ref()

const isExpanded = computed<boolean>(() => sidebar.value?.state === 'expanded')

async function logoutUser(): Promise<void> {
  try {
    await logout()
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
  <UiSidebarProvider class="min-h-full">
    <UiSidebar
      ref="sidebar"
      collapsible="icon"
    >
      <UiSidebarHeader>
        <NuxtLinkLocale
          to="/"
          class="group-data-[collapsible=icon]:py-0 py-2"
        >
          <NuxtImg
            src="/logo.svg"
            alt="DnD Tracker logo"
            width="356"
            height="125"
            sizes="sm:150px"
            class="h-10 group-data-[collapsible=icon]:hidden"
          />
          <NuxtImg
            src="/icon-logo.svg"
            alt="DnD Tracker logo"
            width="147"
            height="125"
            sizes="sm:150px"
            class="h-10 hidden group-data-[collapsible=icon]:block"
          />
        </NuxtLinkLocale>
      </UiSidebarHeader>
      <UiSidebarSeparator class="mx-0" />
      <UiSidebarContent>
        <slot
          name="sidebar-content"
          :is-expanded="isExpanded"
        />
        <UiSidebarSeparator
          v-if="$slots['sidebar-content']"
          class="mx-0"
        />
        <template v-if="!onlyProvidedContent">
          <template
            v-for="sidebarItem in [
              {
                title: 'components.navbar.pages',
                routes: [
                  homeRoute,
                  ...playRoutes,
                  ...routes,
                ],
              },
            ]"
            :key="sidebarItem.title"
          >
            <UiSidebarGroup>
              <UiSidebarGroupLabel class="font-bold">
                {{ $t(sidebarItem.title) }}
              </UiSidebarGroupLabel>
              <UiSidebarMenu>
                <UiSidebarMenuItem
                  v-for="item in sidebarItem.routes"
                  :key="item.label"
                >
                  <UiSidebarMenuButton as-child>
                    <NuxtLinkLocale
                      v-tippy="{
                        content: $t(item.label),
                        placement: 'right',
                        onShow: () => !isExpanded,
                      }"
                      :to="item.url"
                      :data-active="item.url === '/'
                        ? route.path === '/'
                        : route.name?.toString().startsWith(item.url.replace('/', ''))"
                    >
                      <Icon
                        v-if="item.icon"
                        :name="item.icon"
                        class="size-4 min-w-4"
                      />
                      <span class="group-data-[collapsible=icon]:hidden truncate">
                        {{ $t(item.label) }}
                      </span>
                    </NuxtLinkLocale>
                  </UiSidebarMenuButton>
                </UiSidebarMenuItem>
              </UiSidebarMenu>
            </UiSidebarGroup>
          </template>
        </template>
      </UiSidebarContent>
      <UiSidebarFooter>
        <ClientOnly>
          <NuxtLinkLocale
            v-if="user && user.subscription_type !== 'pro'"
            v-tippy="{
              content: $t('components.navbar.upgrade'),
              placement: 'right',
              onShow: () => !isExpanded,
            }"
            to="/pricing"
            class="bg-linear-to-r from-primary to-tertiary text-white rounded-lg p-2 flex items-center gap-x-2 text-sm"
          >
            <Icon
              name="tabler:sparkles"
              class="size-4 min-w-4"
            />
            <span class="group-data-[collapsible=icon]:hidden truncate">
              {{ $t('components.navbar.upgrade') }}
            </span>
            <Icon
              name="tabler:arrow-right"
              class="size-4 min-w-4 ml-auto group-data-[collapsible=icon]:hidden"
            />
          </NuxtLinkLocale>
        </ClientOnly>
        <UiSidebarSeparator class="-mx-2" />
        <UiAlertDialog>
          <UiSidebarMenu>
            <UiSidebarMenuItem>
              <UiDropdownMenu>
                <UiDropdownMenuTrigger as-child>
                  <UiSidebarMenuButton size="lg">
                    <UiAvatar
                      class="border-tertiary border-2"
                      size="xs"
                    >
                      <UiAvatarImage
                        :src="user?.avatar ?? ''"
                        alt="Avatar image"
                      />
                      <UiAvatarFallback class="h-6">
                        <Icon
                          :name="user ? 'tabler:user' : 'tabler:settings'"
                          class="size-6! min-w-6! text-muted-foreground"
                        />
                      </UiAvatarFallback>
                    </UiAvatar>
                    <div
                      v-if="user"
                      class="grid flex-1 text-left text-sm leading-tight"
                    >
                      <span class="truncate font-semibold">{{ user.username }}</span>
                      <span class="truncate text-xs text-muted-foreground">{{ user.name }}</span>
                    </div>
                    <Icon
                      name="tabler:caret-up-down"
                      class="ml-auto size-4"
                    />
                  </UiSidebarMenuButton>
                </UiDropdownMenuTrigger>
                <ProfileMenu
                  class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  :side-offset="4"
                  :routes="profileRoutes"
                  @logout="logoutUser"
                />
              </UiDropdownMenu>
            </UiSidebarMenuItem>
          </UiSidebarMenu>
        </UiAlertDialog>
      </UiSidebarFooter>
      <UiSidebarRail />
    </UiSidebar>
    <UiSidebarInset class="max-w-full max-h-dvh overflow-hidden">
      <header class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div class="flex items-center gap-2 px-4">
          <UiSidebarTrigger class="-ml-1" />
          <UiSeparator
            orientation="vertical"
            class="mr-2 h-4"
          />
          <h1 class="text-2xl font-bold truncate">
            <slot name="header">
              {{ header || '' }}
            </slot>
          </h1>
        </div>
      </header>
      <div class="w-full h-full pt-1 pb-3 px-7 mx-auto overflow-auto no-scrollbar">
        <slot />
      </div>
    </UiSidebarInset>
  </UiSidebarProvider>
</template>
