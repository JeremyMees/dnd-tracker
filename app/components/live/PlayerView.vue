<script setup lang="ts">
const props = defineProps<{
  sheet?: PlayerSheet
  loading: boolean
  error: boolean
}>()

const { seat } = useLiveSeat()

const defaultAllow: LiveAllowActions = {
  hp: true,
  ac: true,
  deathSaves: true,
  concentration: true,
  conditions: true,
}

const allow = computed(() => props.sheet?.allow ?? defaultAllow)

const ownRow = computed(() => {
  if (!seat.value || seat.value.spectator) return undefined

  return props.sheet?.rows.find(row => row.id === seat.value?.row)
})

const activeRow = computed(() => props.sheet?.rows[props.sheet.activeIndex])

const listRef = ref<HTMLElement>()
const rowRefs = new Map<string, HTMLElement>()

function setRowRef(id: string, el: unknown): void {
  const node = (el as { $el?: unknown } | null)?.$el ?? el

  if (node instanceof HTMLElement) rowRefs.set(id, node)
  else rowRefs.delete(id)
}

function scrollActiveIntoView(): void {
  const container = listRef.value
  const row = activeRow.value

  if (!container || !row) return

  const el = rowRefs.get(row.id)

  if (!el) return

  const containerRect = container.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  const inView =
    elRect.top >= containerRect.top && elRect.bottom <= containerRect.bottom

  if (!inView) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

watch(
  () => props.sheet?.activeIndex,
  () => nextTick(scrollActiveIntoView),
)
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
      ref="listRef"
      test-id="list"
      class="flex-1 min-h-0 overflow-y-auto px-4 py-6 md:p-10"
    >
      <div class="flex flex-col gap-4">
        <div v-if="sheet" class="flex items-center justify-between gap-2">
          <h2 test-id="title" class="head-3 truncate">
            {{ sheet.title }}
          </h2>
          <span class="text-muted-foreground shrink-0">
            {{ $t('general.round') }}:
            <span test-id="round" class="font-bold text-foreground">
              {{ sheet.round }}
            </span>
          </span>
        </div>

        <div class="flex flex-col gap-3">
          <template v-if="sheet">
            <LiveRowCard
              v-for="(row, index) in sheet.rows"
              :key="row.id"
              :ref="el => setRowRef(row.id, el)"
              :row="row"
              :active="index === sheet.activeIndex"
            />
          </template>

          <template v-else-if="loading">
            <SkeletonLiveRowCard v-for="i in 4" :key="i" test-id="loading" />
          </template>
        </div>
      </div>
    </div>

    <LiveMyCharacterPanel
      v-if="ownRow"
      :row="ownRow"
      :active="ownRow.id === activeRow?.id"
      :allow="allow"
    />
  </div>
</template>
