<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { encounterShortcuts } from '~~/constants/shortcuts'

defineEmits<{ toggleSidebar: [] }>()
defineProps<{ isExpanded: boolean }>()

const { sheet, editRows } = validateInject(INITIATIVE_SHEET)
const { keyLabel } = useShortcutKeys()

const shortcutsOpen = ref<boolean>(false)

onKeyStroke('?', event => {
  if (!isPlainKeyPress(event)) return

  event.preventDefault()
  shortcutsOpen.value = !shortcutsOpen.value
})

type Modals =
  | 'settings'
  | 'newHomebrew'
  | 'addHomebrew'
  | 'bestiary'
  | 'content'
  | undefined

const openModal = ref<Modals>(undefined)
const remix = ref<ReturnType<typeof monsterToRow>>()

watch(openModal, modal => {
  if (modal !== 'newHomebrew') remix.value = undefined
})

function remixMonster(monster: DndMonster): void {
  remix.value = monsterToRow(monster)
  openModal.value = 'newHomebrew'
}

onBeforeUnmount(() => (openModal.value = undefined))

const maxCharacters = computed(() => hasMaxCharacters(sheet.value))
</script>

<template>
  <UiSidebarGroup>
    <UiSidebarGroupLabel class="font-bold">
      {{ $t('pages.encounter.options') }}
    </UiSidebarGroupLabel>
    <UiSidebarMenu>
      <UiSidebarMenuItem>
        <UiDialog :open="openModal === 'content'">
          <Tooltip
            :text="`${$t('components.navbar.dnd-content')}`"
            side="right"
            :disabled="isExpanded"
          >
            <UiDialogTrigger as-child>
              <UiSidebarMenuButton as-child>
                <button
                  id="tour-3"
                  test-id="content"
                  :aria-label="`${$t('components.navbar.dnd-content')}`"
                  @click="openModal = 'content'"
                >
                  <Icon name="tabler:book" class="size-4 min-w-4 text-help" />
                  <span class="group-data-[collapsible=icon]:hidden truncate">
                    {{ $t('components.navbar.dnd-content') }}
                  </span>
                </button>
              </UiSidebarMenuButton>
            </UiDialogTrigger>
          </Tooltip>
          <UiDialogContent
            class="inset-0 translate-x-0 translate-y-0 max-h-dvh gap-0 border-0 rounded-none!"
            @escape-key-down="openModal = undefined"
            @pointer-down-outside="openModal = undefined"
            @interact-outside="openModal = undefined"
            @close="openModal = undefined"
          >
            <UiDialogHeader>
              <UiDialogTitle class="pb-4">
                {{ $t('components.navbar.dnd-content') }}
              </UiDialogTitle>
              <UiDialogDescription class="sr-only" />
            </UiDialogHeader>
            <FormPinContent />
          </UiDialogContent>
        </UiDialog>
      </UiSidebarMenuItem>
      <UiSidebarMenuItem v-if="maxCharacters">
        <UiSidebarMenuButton
          class="bg-destructive/10 border border-destructive"
        >
          <Tooltip
            :text="$t('pages.encounter.maxCharacters')"
            side="right"
            :disabled="isExpanded"
          >
            <Icon
              test-id="max-characters"
              name="tabler:alert-triangle"
              :aria-hidden="true"
              :class="{ 'relative right-px': !isExpanded }"
              class="size-4 min-w-4 text-destructive"
            />
          </Tooltip>
          <span class="group-data-[collapsible=icon]:hidden truncate">
            {{ $t('pages.encounter.maxCharacters') }}
          </span>
        </UiSidebarMenuButton>
      </UiSidebarMenuItem>
      <template v-else>
        <UiSidebarMenuItem>
          <UiDialog :open="openModal === 'bestiary'">
            <Tooltip
              :text="$t('general.bestiary')"
              side="right"
              :disabled="isExpanded"
            >
              <UiDialogTrigger as-child>
                <UiSidebarMenuButton as-child>
                  <button
                    id="tour-4"
                    test-id="bestiary"
                    :aria-label="$t('general.bestiary')"
                    @click="openModal = 'bestiary'"
                  >
                    <Icon
                      name="tabler:bat"
                      class="size-4 min-w-4 text-destructive"
                    />
                    <span class="group-data-[collapsible=icon]:hidden truncate">
                      {{ $t('general.bestiary') }}
                    </span>
                  </button>
                </UiSidebarMenuButton>
              </UiDialogTrigger>
            </Tooltip>
            <UiDialogContent
              class="inset-0 translate-x-0 translate-y-0 max-h-dvh gap-0 border-0 rounded-none!"
              @escape-key-down="openModal = undefined"
              @pointer-down-outside="openModal = undefined"
              @interact-outside="openModal = undefined"
              @close="openModal = undefined"
            >
              <UiDialogHeader>
                <UiDialogTitle class="pb-4">
                  {{ $t('general.bestiary') }}
                </UiDialogTitle>
                <UiDialogDescription class="sr-only" />
              </UiDialogHeader>
              <FormBestiary persist="local" @remix="remixMonster" />
            </UiDialogContent>
          </UiDialog>
        </UiSidebarMenuItem>
        <UiSidebarMenuItem v-if="sheet?.campaign?.id">
          <UiDialog :open="openModal === 'addHomebrew'">
            <Tooltip
              :text="$t('general.campaignHomebrew')"
              side="right"
              :disabled="isExpanded"
            >
              <UiDialogTrigger as-child>
                <UiSidebarMenuButton as-child>
                  <button
                    id="tour-5"
                    test-id="campaign-homebrew"
                    :aria-label="$t('general.campaignHomebrew')"
                    @click="openModal = 'addHomebrew'"
                  >
                    <Icon
                      name="tabler:meeple"
                      class="size-4 min-w-4 text-primary"
                    />
                    <span class="group-data-[collapsible=icon]:hidden truncate">
                      {{ $t('general.campaignHomebrew') }}
                    </span>
                  </button>
                </UiSidebarMenuButton>
              </UiDialogTrigger>
            </Tooltip>
            <UiDialogContent
              class="max-w-xl gap-0"
              @escape-key-down="openModal = undefined"
              @pointer-down-outside="openModal = undefined"
              @interact-outside="openModal = undefined"
              @close="openModal = undefined"
            >
              <UiDialogHeader>
                <UiDialogTitle class="pb-4">
                  {{ $t('general.campaignHomebrew') }}
                </UiDialogTitle>
                <UiDialogDescription class="sr-only" />
              </UiDialogHeader>
              <FormCampaignHomebrew @close="openModal = undefined" />
            </UiDialogContent>
          </UiDialog>
        </UiSidebarMenuItem>
        <UiSidebarMenuItem>
          <UiDialog :open="openModal === 'newHomebrew'">
            <Tooltip
              :text="$t('general.newHomebrew')"
              side="right"
              :disabled="isExpanded"
            >
              <UiDialogTrigger as-child>
                <UiSidebarMenuButton as-child>
                  <button
                    id="tour-6"
                    test-id="new-homebrew"
                    :aria-label="$t('general.newHomebrew')"
                    @click="openModal = 'newHomebrew'"
                  >
                    <Icon
                      name="tabler:beer"
                      class="size-4 min-w-4 text-warning"
                    />
                    <span class="group-data-[collapsible=icon]:hidden truncate">
                      {{ $t('general.newHomebrew') }}
                    </span>
                  </button>
                </UiSidebarMenuButton>
              </UiDialogTrigger>
            </Tooltip>
            <UiDialogContent
              class="inset-0 translate-x-0 translate-y-0 max-h-dvh gap-0 border-0 rounded-none!"
              @escape-key-down="openModal = undefined"
              @pointer-down-outside="openModal = undefined"
              @interact-outside="openModal = undefined"
              @close="openModal = undefined"
            >
              <UiDialogHeader>
                <UiDialogTitle>
                  {{
                    remix
                      ? $t('actions.remixItem', { item: remix.name })
                      : $t('general.newHomebrew')
                  }}
                </UiDialogTitle>
                <UiDialogDescription class="sr-only" />
              </UiDialogHeader>
              <UiDialogBody>
                <FormHomebrew
                  :campaign-id="sheet?.campaign?.id"
                  :template="remix"
                  :sheet="sheet"
                  :edit-rows="editRows"
                  is-encounter
                  @close="openModal = undefined"
                />
              </UiDialogBody>
            </UiDialogContent>
          </UiDialog>
        </UiSidebarMenuItem>
      </template>
      <UiSidebarMenuItem>
        <UiDialog :open="openModal === 'settings'">
          <Tooltip
            :text="$t('general.setting', 2)"
            side="right"
            :disabled="isExpanded"
          >
            <UiDialogTrigger as-child>
              <UiSidebarMenuButton as-child>
                <button
                  id="tour-7"
                  test-id="settings"
                  :aria-label="$t('general.setting', 2)"
                  @click="openModal = 'settings'"
                >
                  <Icon name="tabler:settings" class="size-4 min-w-4" />
                  <span class="group-data-[collapsible=icon]:hidden truncate">
                    {{ $t('general.setting', 2) }}
                  </span>
                </button>
              </UiSidebarMenuButton>
            </UiDialogTrigger>
          </Tooltip>
          <UiDialogContent
            class="max-w-xl"
            @escape-key-down="openModal = undefined"
            @pointer-down-outside="openModal = undefined"
            @interact-outside="openModal = undefined"
            @close="openModal = undefined"
          >
            <UiDialogHeader>
              <UiDialogTitle>
                {{ $t('general.setting', 2) }}
              </UiDialogTitle>
              <UiDialogDescription class="sr-only" />
            </UiDialogHeader>
            <FormInitiativeSettings @close="openModal = undefined" />
          </UiDialogContent>
        </UiDialog>
      </UiSidebarMenuItem>
      <UiSidebarMenuItem>
        <UiPopover v-model:open="shortcutsOpen">
          <UiPopoverTrigger as-child>
            <UiSidebarMenuButton as-child>
              <button
                id="tour-8"
                test-id="shortcuts-trigger"
                :aria-label="$t('general.shortcut', 2)"
                class="flex items-center gap-x-2"
              >
                <Tooltip
                  :text="`${$t('general.shortcut', 2)}`"
                  :shortcut="['?']"
                  side="right"
                  :disabled="isExpanded"
                >
                  <Icon name="tabler:keyboard" class="size-4 min-w-4" />
                  <span class="group-data-[collapsible=icon]:hidden truncate">
                    {{ $t('general.shortcut', 2) }}
                  </span>
                </Tooltip>
              </button>
            </UiSidebarMenuButton>
          </UiPopoverTrigger>
          <UiPopoverContent
            test-id="shortcuts"
            side="right"
            align="start"
            class="w-80"
          >
            <UiPopoverHeader>
              <UiPopoverTitle>{{ $t('general.shortcut', 2) }}</UiPopoverTitle>
            </UiPopoverHeader>
            <ul class="mt-3 space-y-2">
              <li
                v-for="shortcut in encounterShortcuts"
                :key="shortcut.label"
                test-id="shortcut"
                class="flex items-center justify-between gap-4 text-sm"
              >
                <span>{{ $t(shortcut.label) }}</span>
                <UiKbdGroup class="shrink-0">
                  <UiKbd v-for="key in shortcut.keys" :key="key">
                    {{ keyLabel(key) }}
                  </UiKbd>
                </UiKbdGroup>
              </li>
            </ul>
          </UiPopoverContent>
        </UiPopover>
      </UiSidebarMenuItem>
    </UiSidebarMenu>
  </UiSidebarGroup>
</template>
