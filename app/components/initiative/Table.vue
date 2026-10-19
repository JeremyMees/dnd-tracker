<script setup lang="ts">
import { FlexRender, useTable } from '@tanstack/vue-table'
import { initiativeFeatures } from '~/tables/features'
import { generateColumns, expandedMarkup } from '~/tables/initiative-sheet'
import { prefetchConditionsListing } from '~/queries/srd'
import { useCombatEventsClear } from '~/queries/combat-events'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const props = defineProps<{ loading: boolean; encounterId?: number }>()

const { activeRow, sheet, update, patchRow, nextTurn, onTurnReminders } =
  validateInject(INITIATIVE_SHEET)

const showTurnReminders = useTurnReminders(sheet, patchRow)

onTurnReminders?.(showTurnReminders)

async function nextTurnWithReminders(): Promise<void> {
  const reminders = await nextTurn()

  if (reminders) showTurnReminders(reminders)
}

const {
  previous,
  next,
  reset,
  active,
  target,
  expanded,
  selected,
  columnVisibility,
} = useInitiativeSheet(
  computed(() => sheet.value),
  update,
  nextTurnWithReminders,
)

syncRef(activeRow, active, { direction: 'rtl' })

prefetchConditionsListing()

const tablePadding = computed(() => {
  const style = sheet.value?.settings?.spacing ?? 'normal'
  if (style === 'compact') return 'p-1'
  if (style === 'cozy') return 'p-4'
  else return 'p-2'
})

const { mutate: clearCombatEvents } = useCombatEventsClear()

const columns = generateColumns()
const tableData = shallowRef<InitiativeSheetRow[]>([])
const historyOpen = shallowRef<boolean>(false)
const summaryOpen = shallowRef<boolean>(false)

function handleReset(hard: boolean): void {
  reset(hard)
  summaryOpen.value = false

  if (props.encounterId) clearCombatEvents({ encounterId: props.encounterId })
}

const { t } = useI18n()
const { trigger: triggerRowShortcut, targetId } = useRowShortcut()

function rowShortcut(action: RowShortcutAction): void {
  if (target.value) triggerRowShortcut(target.value.id, action)
}

useCommands(() => {
  const hasRows = !!sheet.value?.rows.length
  const isLair = target.value?.type === 'lair'

  return [
    {
      id: 'next-turn',
      label: t('actions.next'),
      icon: 'tabler:chevron-right',
      shortcut: ['SHIFT', '→'],
      disabled: !hasRows,
      run: next,
    },
    {
      id: 'previous-turn',
      label: t('actions.prev'),
      icon: 'tabler:chevron-left',
      shortcut: ['SHIFT', '←'],
      disabled:
        !hasRows || (sheet.value?.round === 1 && sheet.value.activeIndex === 0),
      run: previous,
    },
    {
      id: 'damage',
      label: t('components.shortcuts.damage'),
      icon: 'tabler:sword',
      iconClass: 'text-destructive',
      shortcut: ['D'],
      disabled: !target.value || !columnVisibility.value.hitPoints,
      run: () => rowShortcut('damage'),
    },
    {
      id: 'heal',
      label: t('components.shortcuts.heal'),
      icon: 'tabler:heart',
      iconClass: 'text-success',
      shortcut: ['H'],
      disabled: !target.value || !columnVisibility.value.hitPoints,
      run: () => rowShortcut('heal'),
    },
    {
      id: 'condition',
      label: t('components.shortcuts.condition'),
      icon: 'tabler:sparkles',
      iconClass: 'text-help',
      shortcut: ['C'],
      disabled: !target.value || isLair || !columnVisibility.value.conditions,
      run: () => rowShortcut('condition'),
    },
    {
      id: 'combat-log',
      label: historyOpen.value
        ? t('actions.closeCombatLog')
        : t('actions.openCombatLog'),
      icon: 'tabler:history',
      iconClass: 'text-info',
      disabled: !props.encounterId,
      run: () => (historyOpen.value = !historyOpen.value),
    },
    {
      id: 'end-encounter',
      label: t('actions.encounterStats'),
      icon: 'tabler:trophy',
      iconClass: 'text-warning',
      disabled: !props.encounterId || !hasRows,
      run: () => (summaryOpen.value = true),
    },
    {
      id: 'reset-soft',
      label: t('components.encounterTable.reset.soft.title'),
      icon: 'tabler:refresh',
      iconClass: 'text-destructive',
      disabled: !hasRows,
      run: () => handleReset(false),
    },
    {
      id: 'reset-hard',
      label: t('components.encounterTable.reset.hard.title'),
      icon: 'tabler:refresh-alert',
      iconClass: 'text-destructive',
      disabled: !hasRows,
      run: () => handleReset(true),
    },
  ]
})

watch(
  () => sheet.value?.rows,
  newRows => {
    tableData.value = newRows || []
  },
  { immediate: true },
)

const table = useTable({
  features: initiativeFeatures,
  data: tableData,
  columns,
  getRowId: (row: InitiativeSheetRow) => row.id.toString(),
  getRowCanExpand: () => true,
  autoResetExpanded: false,
  onExpandedChange: updaterOrValue => valueUpdater(updaterOrValue, expanded),
  onRowSelectionChange: updaterOrValue =>
    valueUpdater(updaterOrValue, selected),
  state: {
    get expanded() {
      return expanded.value
    },
    get rowSelection() {
      return selected.value
    },
    get columnVisibility() {
      return columnVisibility.value
    },
  },
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <InitiativeHeader
      :data="sheet"
      :encounter-id="encounterId"
      @previous="previous"
      @next="next"
    />

    <LazyInitiativeSummary
      v-if="encounterId"
      :encounter-id="encounterId"
      :rows="sheet?.rows"
      :rounds="sheet?.round ?? 1"
      :open="summaryOpen"
      @update:open="summaryOpen = $event"
      @reset="handleReset($event)"
      @keep-playing="summaryOpen = false"
    />

    <div class="flex flex-col lg:flex-row gap-4">
      <div class="flex flex-col gap-2 flex-1 min-w-0">
        <div class="rounded-lg border-4 border-secondary bg-secondary/50">
          <UiTable>
            <UiTableHeader>
              <UiTableRow
                v-for="headerGroup in table.getHeaderGroups()"
                :key="headerGroup.id"
                class="hover:bg-transparent"
              >
                <UiTableHead
                  v-for="header in headerGroup.headers"
                  :key="header.id"
                  test-id="header"
                  :class="tablePadding"
                >
                  <FlexRender v-if="!header.isPlaceholder" :header="header" />
                </UiTableHead>
              </UiTableRow>
            </UiTableHeader>

            <UiTableBody>
              <template v-if="table.getRowModel().rows?.length">
                <template
                  v-for="(row, index) in table.getRowModel().rows"
                  :key="row.id"
                >
                  <UiTableRow
                    :id="index === 0 ? 'tour-9' : ''"
                    test-id="row"
                    :data-state="selected[row.id] && 'selected'"
                    :data-target="targetId === row.id || undefined"
                    class="data-[state=selected]:bg-muted-foreground/10 data-target:inset-ring-2 data-target:inset-ring-primary rounded-lg transition-colors duration-300"
                  >
                    <UiTableCell
                      v-for="cell in row.getVisibleCells()"
                      :key="cell.id"
                      :class="tablePadding"
                    >
                      <FlexRender :cell="cell" />
                    </UiTableCell>
                  </UiTableRow>
                  <UiTableRow v-if="row.getIsExpanded()" test-id="expanded">
                    <UiTableCell :colspan="row.getAllCells().length">
                      <FlexRender :render="expandedMarkup(row)" />
                    </UiTableCell>
                  </UiTableRow>
                </template>
              </template>

              <template v-else-if="loading">
                <SkeletonInitiativeTableRow
                  v-for="i in 10"
                  :key="i"
                  test-id="loading"
                  :class="tablePadding"
                />
              </template>

              <UiTableRow v-else test-id="empty-state">
                <UiTableCell :colspan="columns.length" class="md:p-10">
                  <InitiativeTableEmptyState :campaign="!!sheet?.campaign" />
                </UiTableCell>
              </UiTableRow>
            </UiTableBody>
          </UiTable>
        </div>

        <LazyInitiativeWidgets test-id="widgets" :encounter-id="encounterId" />
      </div>

      <LazyInitiativeHistoryPanel
        v-if="historyOpen && encounterId"
        hydrate-on-idle
        :encounter-id="encounterId"
      />
    </div>
  </div>
</template>
