<script setup lang="ts">
const props = defineProps<{
  sheet?: PlayerSheet
  loading: boolean
  error: boolean
}>()

const { ownRowId } = useLiveSeat()

const isDesktop = useMediaQuery('(min-width: 1024px)')

const defaultAllow: LiveAllowActions = {
  hp: true,
  ac: true,
  deathSaves: true,
  concentration: true,
  conditions: true,
  endTurn: true,
}

const allow = computed(() => props.sheet?.allow ?? defaultAllow)

const ownRow = computed(() =>
  props.sheet?.rows.find(row => row.id === ownRowId.value),
)

const activeRow = computed(() => props.sheet?.rows[props.sheet.activeIndex])
</script>

<template>
  <Card
    v-if="error"
    test-id="error"
    class="h-[40vh] flex flex-col items-center justify-center gap-2"
  >
    <Icon name="tabler:alert-triangle" class="size-10" aria-hidden="true" />
    <p class="head-3">
      {{ $t('general.error.text') }}
    </p>
  </Card>

  <div v-else class="fixed inset-0 flex flex-col">
    <div
      v-if="sheet"
      class="dnd-container shrink-0 flex flex-wrap items-center justify-between gap-2 py-4 border-b"
    >
      <div class="flex items-center gap-4 min-w-0">
        <NuxtLinkLocale to="/" :aria-label="$t('components.navbar.home')">
          <NuxtImg
            src="/icon-logo.svg"
            alt="DnD Tracker logo"
            sizes="sm:150px"
            class="h-10"
          />
        </NuxtLinkLocale>
        <h2 test-id="title" class="head-4 truncate">
          {{ sheet.title }}
        </h2>
      </div>
      <UiBadge variant="muted" class="shrink-0">
        {{ $t('general.round') }}:
        <span test-id="round" class="font-bold ml-1">{{ sheet.round }}</span>
      </UiBadge>
    </div>

    <div class="flex-1 min-h-0 flex">
      <LiveRowTable v-if="isDesktop" :sheet="sheet" :loading="loading" />
      <LiveRowList v-else :sheet="sheet" :loading="loading" />

      <LiveMyCharacterSidePanel
        v-if="isDesktop && ownRow"
        :row="ownRow"
        :active-row="activeRow"
        :allow="allow"
      />
    </div>

    <LiveMyCharacterPanel
      v-if="!isDesktop && ownRow"
      :row="ownRow"
      :active-row="activeRow"
      :allow="allow"
    />
  </div>
</template>
