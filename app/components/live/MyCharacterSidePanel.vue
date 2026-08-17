<script setup lang="ts">
const props = defineProps<{
  row: PlayerRow
  allow: LiveAllowActions
  activeRow?: PlayerRow
}>()

const active = computed(() => props.row.id === props.activeRow?.id)
</script>

<template>
  <aside
    test-id="my-character-side-panel"
    :data-active="active"
    class="w-[380px] shrink-0 overflow-y-auto p-6 transition-all duration-300"
    :class="
      active
        ? 'border-l-4 border-primary bg-primary/5'
        : 'border-l border-border bg-background'
    "
  >
    <div class="flex items-start justify-between gap-2 mb-6">
      <div class="min-w-0">
        <p
          class="text-xs font-bold uppercase tracking-wide text-muted-foreground"
        >
          {{
            active ? $t('pages.live.yourTurn') : $t('pages.live.currentTurn')
          }}
        </p>
        <p test-id="heading" class="head-4 truncate">
          {{ active ? row.name : activeRow?.name }}
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
      v-if="active"
      :row="row"
      :active="active"
      :allow="allow"
    />

    <div v-else test-id="waiting" class="flex flex-col gap-4">
      <p class="text-sm text-muted-foreground">
        {{ $t('pages.live.waitingText', { name: row.name }) }}
      </p>

      <UiSeparator class="bg-muted" />

      <div class="flex flex-col gap-2">
        <span class="text-xs font-bold text-muted-foreground">
          {{ $t('pages.live.yourStatus') }}
        </span>
        <div class="flex flex-wrap items-center gap-4">
          <LiveStatHp :row="row" icon>
            <LiveStatHealthBand v-if="row.healthBand" :band="row.healthBand" />
          </LiveStatHp>
          <LiveStatAc :row="row" icon />
          <LiveStatConcentration :active="row.concentration" label />
        </div>
      </div>
    </div>
  </aside>
</template>
