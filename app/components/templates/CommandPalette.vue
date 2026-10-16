<script setup lang="ts">
import { defaultSrdDocuments } from '~~/constants/dnd'
import { useEncounterListing } from '~/queries/encounters'
import { useSrdMonsterListing } from '~/queries/srd'

const { open } = useCommandPalette()
const search = ref<string>('')
const debouncedSearch = refDebounced(search, 300)

const { user } = useAuthentication()
const localePath = useLocalePath()
const commands = useRegisteredCommands()
const { keyLabel } = useShortcutKeys()
const { isAvailable, isFull, addMonster } = useAddMonster()

const query = computed<string>(() => debouncedSearch.value.trim())
const canSearch = computed<boolean>(() => open.value && query.value.length >= 2)
const canAddMonsters = computed<boolean>(
  () => isAvailable.value && !isFull.value,
)

const { data: monsters, isFetching: monstersLoading } = useSrdMonsterListing(
  computed(() => ({
    filters: {
      page: 0,
      search: query.value,
      documents: [...defaultSrdDocuments],
    },
  })),
  () => canSearch.value && canAddMonsters.value,
)

const { data: encounters, isFetching: encountersLoading } = useEncounterListing(
  computed(() => ({ search: query.value, page: 0 })),
  computed(() => canSearch.value && !!user.value),
  5,
)

const monsterResults = computed<DndMonster[]>(() =>
  canSearch.value && canAddMonsters.value
    ? (monsters.value?.items.slice(0, 5) ?? [])
    : [],
)
const encounterResults = computed<EncounterItem[]>(() =>
  canSearch.value && user.value ? (encounters.value?.encounters ?? []) : [],
)
const isSearching = computed<boolean>(
  () =>
    search.value.trim() !== query.value ||
    (canSearch.value && (monstersLoading.value || encountersLoading.value)),
)

onKeyStroke('k', event => {
  if (!event.metaKey && !event.ctrlKey) return

  event.preventDefault()
  open.value = !open.value
})

watch(open, isOpen => {
  if (!isOpen) search.value = ''
})

function run(action: () => unknown): void {
  open.value = false
  action()
}

function goTo(to: Parameters<typeof localePath>[0]): void {
  run(() => navigateTo(localePath(to)))
}
</script>

<template>
  <UiDialog v-model:open="open">
    <UiDialogContent
      test-id="command-palette"
      class="overflow-hidden p-0 gap-0 max-w-xl top-[15vh] translate-y-0"
    >
      <UiDialogHeader class="sr-only">
        <UiDialogTitle>{{
          $t('components.commandPalette.title')
        }}</UiDialogTitle>
        <UiDialogDescription>
          {{ $t('components.commandPalette.description') }}
        </UiDialogDescription>
      </UiDialogHeader>
      <UiCommand>
        <UiCommandInput
          test-id="command-palette-input"
          class="pr-8"
          :placeholder="$t('components.commandPalette.placeholder')"
          @update:model-value="search = String($event ?? '')"
        />
        <UiCommandList class="max-h-[60vh]">
          <UiCommandEmpty
            v-if="
              !isSearching && !monsterResults.length && !encounterResults.length
            "
            test-id="command-palette-empty"
          >
            {{ $t('components.commandPalette.empty') }}
          </UiCommandEmpty>

          <UiCommandGroup
            v-if="commands.length"
            :heading="$t('components.commandPalette.groups.actions')"
          >
            <UiCommandItem
              v-for="command in commands"
              :key="command.id"
              :value="command.id"
              :test-id="`command-${command.id}`"
              @select="run(command.run)"
            >
              <Icon
                :name="command.icon"
                :class="command.iconClass"
                class="size-4 min-w-4"
                :aria-hidden="true"
              />
              <span>{{ command.label }}</span>
              <span v-if="command.keywords?.length" class="sr-only">
                {{ command.keywords.join(' ') }}
              </span>
              <UiCommandShortcut v-if="command.shortcut">
                <UiKbdGroup>
                  <UiKbd v-for="key in command.shortcut" :key="key">
                    {{ keyLabel(key) }}
                  </UiKbd>
                </UiKbdGroup>
              </UiCommandShortcut>
            </UiCommandItem>
          </UiCommandGroup>

          <UiCommandGroup
            v-if="monsterResults.length"
            :heading="$t('components.commandPalette.groups.monsters')"
          >
            <UiCommandItem
              v-for="monster in monsterResults"
              :key="monster.id"
              :value="`monster-${monster.id}`"
              test-id="command-monster"
              @select="run(() => addMonster(monster))"
            >
              <Icon
                name="tabler:bat"
                class="size-4 min-w-4 text-destructive"
                :aria-hidden="true"
              />
              <span class="truncate">{{ monster.name }}</span>
              <UiCommandShortcut class="tracking-normal">
                {{ $t('components.inputs.challengeLabel') }}
                {{ formatChallengeRating(monster.challengeRating) }}
              </UiCommandShortcut>
            </UiCommandItem>
          </UiCommandGroup>

          <UiCommandGroup
            v-if="encounterResults.length"
            :heading="$t('components.commandPalette.groups.encounters')"
          >
            <UiCommandItem
              v-for="encounter in encounterResults"
              :key="encounter.id"
              :value="`encounter-${encounter.id}`"
              test-id="command-encounter"
              @select="goTo(encounterUrl(encounter))"
            >
              <Icon
                name="tabler:swords"
                class="size-4 min-w-4"
                :aria-hidden="true"
              />
              <span class="truncate">{{ encounter.title }}</span>
              <UiCommandShortcut
                v-if="encounter.campaign"
                class="tracking-normal truncate max-w-40"
              >
                {{ encounter.campaign.title }}
              </UiCommandShortcut>
            </UiCommandItem>
          </UiCommandGroup>

          <p
            v-if="isSearching"
            test-id="command-palette-loading"
            class="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground"
          >
            <Icon
              name="tabler:loader-2"
              class="size-4 min-w-4 animate-spin"
              :aria-hidden="true"
            />
            {{ $t('components.commandPalette.loading') }}
          </p>
        </UiCommandList>
      </UiCommand>
    </UiDialogContent>
  </UiDialog>
</template>
