<script setup lang="ts">
const props = defineProps<{
  row: PlayerRow
  rows: PlayerRow[]
  allow: LiveAllowActions
  settings: PlayerSheetSettings
  activeRow?: PlayerRow
}>()

const active = computed(() => props.row.id === props.activeRow?.id)
</script>

<template>
  <UiScrollArea
    as="aside"
    test-id="my-character-side-panel"
    :data-active="active"
    class="w-[380px] shrink-0 transition-all duration-300"
    viewport-class="p-6"
    :class="
      active
        ? 'border-l-4 border-primary bg-primary/5'
        : 'border-l border-border bg-background'
    "
  >
    <div class="flex items-start justify-between gap-2 mb-6">
      <div class="min-w-0">
        <p
          test-id="turn"
          class="text-xs font-bold uppercase tracking-wide text-muted-foreground truncate"
        >
          <template v-if="active">{{ $t('pages.live.yourTurn') }}</template>
          <template v-else>
            {{ $t('pages.live.currentTurn') }}: {{ activeRow?.name }}
          </template>
        </p>
        <p test-id="heading" class="head-4 truncate">
          {{ row.name }}
        </p>
      </div>
      <Icon
        :name="active ? 'tabler:sparkles' : 'tabler:clock'"
        :class="active ? 'text-primary' : 'text-muted-foreground'"
        class="size-6 min-w-6 shrink-0"
        aria-hidden="true"
      />
    </div>

    <LiveMyCharacterControls
      :row="row"
      :rows="rows"
      :active="active"
      :allow="allow"
      :settings="settings"
    />
  </UiScrollArea>
</template>
