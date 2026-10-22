<script setup lang="ts">
const props = defineProps<{
  row: PlayerRow
  rows: PlayerRow[]
  allow: LiveAllowActions
  activeRow?: PlayerRow
}>()

const active = computed(() => props.row.id === props.activeRow?.id)
const collapsed = ref(!active.value)

watch(active, value => {
  collapsed.value = !value
})

function toggle(): void {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <div
    test-id="my-character-panel"
    class="shrink-0 transition-all duration-300 bg-background pb-[env(safe-area-inset-bottom)]"
    :class="
      active
        ? 'border-4 border-primary rounded-t-2xl tracker-shadow'
        : 'border-t border-border'
    "
  >
    <button
      test-id="toggle"
      type="button"
      :aria-label="$t(collapsed ? 'actions.expand' : 'actions.collapse')"
      class="w-full flex items-center justify-between gap-2 p-3"
      @click="toggle"
    >
      <span class="flex items-center gap-2 min-w-0">
        <Icon
          :name="active ? 'tabler:sparkles' : 'tabler:clock'"
          :class="active ? 'text-primary' : 'text-muted-foreground'"
          class="size-5 min-w-5"
          aria-hidden="true"
        />
        <span test-id="title" class="font-bold truncate">
          <template v-if="active">
            {{ $t('pages.live.yourTurn') }} &middot; {{ row.name }}
          </template>
          <template v-else>
            {{ row.name }} &middot;
            <span class="font-normal text-muted-foreground">
              {{ $t('general.waiting') }}: {{ activeRow?.name }}
            </span>
          </template>
        </span>
      </span>
      <Icon
        name="tabler:chevron-up"
        :class="{ 'rotate-180': collapsed }"
        class="size-5 min-w-5 shrink-0 transition-transform duration-200"
        aria-hidden="true"
      />
    </button>

    <AnimationExpandHeight>
      <div v-show="!collapsed" test-id="controls">
        <UiScrollArea class="max-h-[45vh]" viewport-class="px-4 pb-4">
          <LiveMyCharacterControls
            :row="row"
            :rows="rows"
            :active="active"
            :allow="allow"
          />
        </UiScrollArea>
      </div>
    </AnimationExpandHeight>
  </div>
</template>
