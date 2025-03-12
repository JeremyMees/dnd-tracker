<script setup lang="ts">
defineEmits<{
  toggleSidebar: []
  tweakSettings: []
}>()

const props = defineProps<{ isExpanded: boolean }>()

const modal = useModal()

const diceRoll = ref()
</script>

<template>
  <UiSidebarGroup>
    <UiSidebarGroupLabel class="font-bold">
      {{ $t('pages.encounter.options') }}
    </UiSidebarGroupLabel>
    <UiSidebarMenu>
      <UiSidebarMenuItem>
        <UiSidebarMenuButton as-child>
          <button
            v-tippy="{
              content: `DnD ${$t('general.content')}`,
              placement: 'right',
              onShow: () => !isExpanded,
            }"
            :aria-label="`DnD ${$t('general.content')}`"
            @click="$emit('tweakSettings')"
          >
            <Icon
              name="tabler:search"
              class="size-4 min-w-4 text-success"
            />
            <span class="group-data-[collapsible=icon]:hidden truncate text-muted-foreground">
              DnD {{ $t('general.content') }}
            </span>
          </button>
        </UiSidebarMenuButton>
      </UiSidebarMenuItem>
      <UiSidebarMenuItem v-if="!isExpanded">
        <UiSidebarMenuButton as-child>
          <button
            v-tippy="{
              content: $t('actions.roll'),
              placement: 'right',
            }"
            :aria-label="$t('actions.roll')"
            class="flex items-center gap-x-2"
            @click="() => {
              if (!props.isExpanded) {
                modal.open({
                  component: 'DiceRoll',
                  header: $t('actions.roll'),
                  submit: $t('actions.roll'),
                })
              }
            }"
          >
            <Icon
              name="tabler:hexagon"
              class="size-4 min-w-4 text-tertiary"
            />
            <span class="group-data-[collapsible=icon]:hidden truncate text-muted-foreground">
              {{ $t('actions.roll') }}
            </span>
          </button>
        </UiSidebarMenuButton>
      </UiSidebarMenuItem>
      <UiCollapsible v-else>
        <UiCollapsibleTrigger as-child>
          <UiSidebarMenuItem>
            <UiSidebarMenuButton as-child>
              <button
                :aria-label="$t('actions.roll')"
                class="flex items-center gap-x-2"
              >
                <Icon
                  name="tabler:hexagon"
                  class="size-4 min-w-4 text-tertiary"
                />
                <span class="group-data-[collapsible=icon]:hidden truncate text-muted-foreground">
                  {{ $t('actions.roll') }}
                </span>
              </button>
            </UiSidebarMenuButton>
          </UiSidebarMenuItem>
        </UiCollapsibleTrigger>
        <UiCollapsibleContent class="pt-2 border border-sidebar-border rounded-lg p-2 mt-2">
          <FormKit
            type="form"
            :actions="false"
            wrapper-class="border rounded-lg p-2"
            @submit="diceRoll?.roll"
          >
            <FormDiceRoll ref="diceRoll" />
          </FormKit>
        </UiCollapsibleContent>
      </UiCollapsible>
      <UiSidebarMenuItem>
        <UiSidebarMenuButton as-child>
          <button
            v-tippy="{
              content: $t('general.bestiary'),
              placement: 'right',
              onShow: () => !isExpanded,
            }"
            :aria-label="$t('general.bestiary')"
            @click="$emit('tweakSettings')"
          >
            <Icon
              name="tabler:bat"
              class="size-4 min-w-4 text-destructive"
            />
            <span class="group-data-[collapsible=icon]:hidden truncate text-muted-foreground">
              {{ $t('general.bestiary') }}
            </span>
          </button>
        </UiSidebarMenuButton>
      </UiSidebarMenuItem>
      <UiSidebarMenuItem>
        <UiSidebarMenuButton as-child>
          <button
            v-tippy="{
              content: $t('general.campaignHomebrew'),
              placement: 'right',
              onShow: () => !isExpanded,
            }"
            :aria-label="$t('general.campaignHomebrew')"
            @click="$emit('tweakSettings')"
          >
            <Icon
              name="tabler:meeple"
              class="size-4 min-w-4 text-primary"
            />
            <span class="group-data-[collapsible=icon]:hidden truncate text-muted-foreground">
              {{ $t('general.campaignHomebrew') }}
            </span>
          </button>
        </UiSidebarMenuButton>
      </UiSidebarMenuItem>
      <UiSidebarMenuItem>
        <UiSidebarMenuButton as-child>
          <button
            v-tippy="{
              content: $t('general.newHomebrew'),
              placement: 'right',
              onShow: () => !isExpanded,
            }"
            :aria-label="$t('general.newHomebrew')"
            @click="$emit('tweakSettings')"
          >
            <Icon
              name="tabler:beer"
              class="size-4 min-w-4 text-warning"
            />
            <span class="group-data-[collapsible=icon]:hidden truncate text-muted-foreground">
              {{ $t('general.newHomebrew') }}
            </span>
          </button>
        </UiSidebarMenuButton>
      </UiSidebarMenuItem>
      <UiSidebarMenuItem>
        <UiSidebarMenuButton as-child>
          <button
            v-tippy="{
              content: $t('general.setting', 2),
              placement: 'right',
              onShow: () => !isExpanded,
            }"
            :aria-label="$t('general.setting', 2)"
            @click="$emit('tweakSettings')"
          >
            <Icon
              name="tabler:settings"
              class="size-4 min-w-4"
            />
            <span class="group-data-[collapsible=icon]:hidden truncate text-muted-foreground">
              {{ $t('general.setting', 2) }}
            </span>
          </button>
        </UiSidebarMenuButton>
      </UiSidebarMenuItem>
      <UiSidebarMenuItem>
        <UiSidebarMenuButton as-child>
          <tippy
            trigger="click"
            placement="right"
            :delay="0"
          >
            <button
              v-tippy="{
                content: $t('general.hotkey', 2),
                placement: 'right',
                onShow: () => !isExpanded,
              }"
              :aria-label="$t('general.hotkey', 2)"
              class="flex items-center gap-x-2"
            >
              <Icon
                name="tabler:keyboard"
                class="size-4 min-w-4"
              />
              <span class="group-data-[collapsible=icon]:hidden truncate text-muted-foreground">
                {{ $t('general.hotkey', 2) }}
              </span>
            </button>
            <template #content>
              <div class="p-4 space-y-2 overflow-auto">
                <p class="head-2 pb-4">
                  {{ $t('general.hotkey', 2) }}
                </p>
                <div class="space-y-4">
                  <div class="space-y-2">
                    <p class="font-medium">
                      {{ $t('general.modifierKeys') }}
                    </p>
                    <span class="flex flex-row">
                      <kbd>⌃</kbd>
                      <span class="mx-1 text-muted-foreground">/</span>
                      <kbd>⌘</kbd>
                      <span class="mx-1 text-muted-foreground">/</span>
                      <kbd>⇧</kbd>
                    </span>
                  </div>
                  <div class="space-y-2">
                    <p class="font-medium">
                      {{ $t('actions.changeInitiative') }}
                    </p>
                    <div class="flex items-center">
                      <span class="mr-1 body-small text-muted-foreground">
                        MOD +
                      </span>
                      <span class="flex flex-row">
                        <kbd>←</kbd>
                        <span class="mx-1 text-muted-foreground">/</span>
                        <kbd>→</kbd>
                      </span>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <p class="font-medium">
                      {{ $t('actions.collapse') }}/{{ $t('actions.expand') }}
                    </p>
                    <div class="flex items-center">
                      <span class="mr-1 text-muted-foreground">MOD +</span>
                      <span class="flex flex-row">
                        <kbd>⏎</kbd>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </tippy>
        </UiSidebarMenuButton>
      </UiSidebarMenuItem>
    </UiSidebarMenu>
  </UiSidebarGroup>
  <UiSeparator />
</template>
