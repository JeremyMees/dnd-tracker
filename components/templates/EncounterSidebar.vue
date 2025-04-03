<script setup lang="ts">
defineEmits<{ toggleSidebar: [] }>()

const props = defineProps<{
  data: InitiativeSheet | undefined
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
  isExpanded: boolean
}>()

type Modals = 'settings' | 'newHomebrew' | 'addHomebrew' | 'bestiary' | 'content' | undefined

const diceRollerOpen = ref(false)
const fantasyNameGeneratorOpen = ref(false)
const saveHomebrewToCampaign = ref(false)
const openModal = ref<Modals>(undefined)

const maxCharacters = computed(() => hasMaxCharacters(props.data))
</script>

<template>
  <UiSidebarGroup>
    <UiSidebarGroupLabel class="font-bold">
      {{ $t('pages.encounter.options') }}
    </UiSidebarGroupLabel>
    <UiSidebarMenu>
      <UiSidebarMenuItem>
        <UiPopover v-model:open="diceRollerOpen">
          <UiPopoverTrigger as-child>
            <UiSidebarMenuButton as-child>
              <button
                v-tippy="{
                  content: $t('actions.roll'),
                  placement: 'right',
                  onShow: () => !isExpanded,
                }"
                :aria-label="$t('actions.roll')"
                class="flex items-center gap-x-2 p-2 w-full text-sm"
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
          </UiPopoverTrigger>
          <UiPopoverContent
            align="center"
            side="right"
            prioritize-position
          >
            <DiceRoller
              :styled="false"
              @rolled="diceRollerOpen = false"
            />
          </UiPopoverContent>
        </UiPopover>
      </UiSidebarMenuItem>
      <UiSidebarMenuItem>
        <UiDialog
          :open="openModal === 'content'"
          @close="openModal = undefined"
        >
          <UiDialogTrigger as-child>
            <UiSidebarMenuButton as-child>
              <button
                v-tippy="{
                  content: `${$t('components.navbar.dnd-content')}`,
                  placement: 'right',
                  onShow: () => !isExpanded,
                }"
                :aria-label="`${$t('components.navbar.dnd-content')}`"
                @click="openModal = 'content'"
              >
                <Icon
                  name="tabler:book"
                  class="size-4 min-w-4 text-help"
                />
                <span class="group-data-[collapsible=icon]:hidden truncate text-muted-foreground">
                  {{ $t('components.navbar.dnd-content') }}
                </span>
              </button>
            </UiSidebarMenuButton>
          </UiDialogTrigger>
          <UiDialogContent
            class="inset-0 translate-x-0 translate-y-0 max-h-[100dvh] gap-0"
            @escape-key-down="openModal = undefined"
            @pointer-down-outside="openModal = undefined"
            @interact-outside="openModal = undefined"
            @close="openModal = undefined"
          >
            <UiDialogHeader>
              <UiDialogTitle class="pb-4">
                {{ $t('components.navbar.dnd-content') }}
              </UiDialogTitle>
            </UiDialogHeader>
            <FormPinContent
              :sheet="data"
              :update="update"
            />
          </UiDialogContent>
        </UiDialog>
      </UiSidebarMenuItem>
      <UiSidebarMenuItem v-if="maxCharacters">
        <UiSidebarMenuButton class="bg-destructive/10 border border-destructive">
          <Icon
            v-tippy="{
              content: $t('pages.encounter.maxCharacters'),
              placement: 'right',
              onShow: () => !isExpanded,
            }"
            name="tabler:alert-triangle"
            :aria-hidden="true"
            :class="{ 'relative right-[1px]': !isExpanded }"
            class="size-4 min-w-4 text-destructive"
          />
          <span class="group-data-[collapsible=icon]:hidden truncate text-muted-foreground">
            {{ $t('pages.encounter.maxCharacters') }}
          </span>
        </UiSidebarMenuButton>
      </UiSidebarMenuItem>
      <template v-else>
        <UiSidebarMenuItem>
          <UiDialog
            :open="openModal === 'bestiary'"
            @close="openModal = undefined"
          >
            <UiDialogTrigger as-child>
              <UiSidebarMenuButton as-child>
                <button
                  v-tippy="{
                    content: $t('general.bestiary'),
                    placement: 'right',
                    onShow: () => !isExpanded,
                  }"
                  :aria-label="$t('general.bestiary')"
                  @click="openModal = 'bestiary'"
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
            </UiDialogTrigger>
            <UiDialogContent
              class="inset-0 translate-x-0 translate-y-0 max-h-[100dvh] gap-0"
              @escape-key-down="openModal = undefined"
              @pointer-down-outside="openModal = undefined"
              @interact-outside="openModal = undefined"
              @close="openModal = undefined"
            >
              <UiDialogHeader>
                <UiDialogTitle class="pb-4">
                  {{ $t('general.bestiary') }}
                </UiDialogTitle>
              </UiDialogHeader>
              <FormBestiary
                :sheet="data"
                :update="update"
              />
            </UiDialogContent>
          </UiDialog>
        </UiSidebarMenuItem>
        <UiSidebarMenuItem v-if="data?.campaign?.id">
          <UiDialog
            :open="openModal === 'addHomebrew'"
            @close="openModal = undefined"
          >
            <UiDialogTrigger as-child>
              <UiSidebarMenuButton as-child>
                <button
                  v-tippy="{
                    content: $t('general.campaignHomebrew'),
                    placement: 'right',
                    onShow: () => !isExpanded,
                  }"
                  :aria-label="$t('general.campaignHomebrew')"
                  @click="openModal = 'addHomebrew'"
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
            </UiDialogTrigger>
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
              </UiDialogHeader>
              <FormCampaignHomebrew
                :sheet="data"
                :update="update"
                @close="openModal = undefined"
              />
            </UiDialogContent>
          </UiDialog>
        </UiSidebarMenuItem>
        <UiSidebarMenuItem v-if="data?.campaign?.id">
          <UiDialog
            :open="openModal === 'newHomebrew'"
            @close="saveHomebrewToCampaign = false, openModal = undefined"
          >
            <UiDialogTrigger as-child>
              <UiSidebarMenuButton as-child>
                <button
                  v-tippy="{
                    content: $t('general.newHomebrew'),
                    placement: 'right',
                    onShow: () => !isExpanded,
                  }"
                  :aria-label="$t('general.newHomebrew')"
                  @click="openModal = 'newHomebrew'"
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
            </UiDialogTrigger>
            <UiDialogContent
              class="max-w-xl"
              @escape-key-down="openModal = undefined"
              @pointer-down-outside="openModal = undefined"
              @interact-outside="openModal = undefined"
              @close="openModal = undefined"
            >
              <UiDialogHeader>
                <UiDialogTitle>
                  {{ $t('general.newHomebrew') }}
                </UiDialogTitle>
              </UiDialogHeader>
              <div class="overflow-y-auto">
                <FormHomebrew
                  v-if="data?.campaign?.id"
                  :campaign-id="data.campaign.id"
                  :count="data.rows.length"
                  :save-to-campaign="saveHomebrewToCampaign"
                  :sheet="data"
                  is-encounter
                  @close="openModal = undefined"
                />
              </div>
              <UiDialogFooter class="items-center">
                <div
                  v-if="!$route.fullPath.includes('/playground')"
                  class="flex flex-col gap-x-2 mr-4"
                >
                  <FormKit
                    v-model="saveHomebrewToCampaign"
                    :disabled="data.rows.length >= 100"
                    :label="$t('components.homebrewModal.save')"
                    type="toggle"
                    outer-class="$reset !mb-0"
                  />
                  <span
                    v-if="data.rows.length >= 100"
                    class="text-destructive body-small"
                  >
                    {{ $t('components.homebrewModal.max') }}
                  </span>
                </div>
                <FormKit
                  type="submit"
                  form="Homebrew"
                  :label="$t('actions.save')"
                />
              </UiDialogFooter>
            </UiDialogContent>
          </UiDialog>
        </UiSidebarMenuItem>
      </template>
      <UiSidebarMenuItem>
        <UiPopover v-model:open="fantasyNameGeneratorOpen">
          <UiPopoverTrigger as-child>
            <UiSidebarMenuButton as-child>
              <button
                v-tippy="{
                  content: $t('components.navbar.fantasy'),
                  placement: 'right',
                  onShow: () => !isExpanded,
                }"
                :aria-label="$t('components.navbar.fantasy')"
                class="flex items-center gap-x-2 p-2 w-full text-sm"
              >
                <Icon
                  name="tabler:signature"
                  class="size-4 min-w-4 text-success"
                />
                <span class="group-data-[collapsible=icon]:hidden truncate text-muted-foreground">
                  {{ $t('components.navbar.fantasy') }}
                </span>
              </button>
            </UiSidebarMenuButton>
          </UiPopoverTrigger>
          <UiPopoverContent
            align="center"
            side="right"
            prioritize-position
          >
            <FantasyNameGenerator :amount="10" />
          </UiPopoverContent>
        </UiPopover>
      </UiSidebarMenuItem>
      <UiSidebarMenuItem>
        <UiDialog
          :open="openModal === 'settings'"
          @close="openModal = undefined"
        >
          <UiDialogTrigger as-child>
            <UiSidebarMenuButton as-child>
              <button
                v-tippy="{
                  content: $t('general.setting', 2),
                  placement: 'right',
                  onShow: () => !isExpanded,
                }"
                :aria-label="$t('general.setting', 2)"
                @click="openModal = 'settings'"
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
          </UiDialogTrigger>
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
            </UiDialogHeader>
            <FormInitiativeSettings
              :sheet="data"
              :update="update"
              @close="openModal = undefined"
            />
            <UiDialogFooter>
              <FormKit
                type="submit"
                form="InitiativeSettings"
                :label="$t('actions.save')"
              />
            </UiDialogFooter>
          </UiDialogContent>
        </UiDialog>
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
</template>
