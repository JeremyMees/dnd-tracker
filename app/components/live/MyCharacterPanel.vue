<script setup lang="ts">
const props = defineProps<{
  row: PlayerRow
  active: boolean
  allow: LiveAllowActions
}>()

const collapsed = ref(false)

watch(
  () => props.active,
  value => {
    collapsed.value = !value
  },
)
</script>

<template>
  <div
    test-id="my-character-panel"
    class="flex flex-col bg-tertiary/50 border-t-4 border-tertiary pb-[env(safe-area-inset-bottom)]"
  >
    <button
      test-id="toggle"
      type="button"
      :aria-label="$t(collapsed ? 'actions.expand' : 'actions.collapse')"
      class="flex items-center justify-between gap-2 p-3 shrink-0"
      @click="collapsed = !collapsed"
    >
      <div class="flex items-center gap-2 min-w-0">
        <span test-id="name" class="font-bold truncate">{{ row.name }}</span>
      </div>
      <Icon
        name="tabler:chevron-up"
        :class="{ 'rotate-180': collapsed }"
        class="size-5 min-w-5 shrink-0 transition-transform duration-200"
        aria-hidden="true"
      />
    </button>

    <AnimationExpandHeight>
      <div v-show="!collapsed" test-id="controls">
        <div class="max-h-[45vh] overflow-y-auto px-4 pb-4">
          <LiveMyCharacterControls :row="row" :active="active" :allow="allow" />
        </div>
      </div>
    </AnimationExpandHeight>
  </div>
</template>
