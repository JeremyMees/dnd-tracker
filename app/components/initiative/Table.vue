<script setup lang="ts">
import { FlexRender, useTable } from '@tanstack/vue-table'
import { initiativeFeatures } from '~/tables/features'
import { generateColumns, expandedMarkup } from '~/tables/initiative-sheet'
import { prefetchConditionsListing } from '~/queries/open5e'
import { useCombatEventsClear } from '~/queries/combat-events'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const props = defineProps<{ loading: boolean; encounterId?: number }>()

const { activeRow, sheet, update } = validateInject(INITIATIVE_SHEET)

const { previous, next, reset, active, expanded, selected, columnVisibility } =
  useInitiativeSheet(
    computed(() => sheet.value),
    update,
  )

syncRef(activeRow, active, { direction: 'rtl' })

prefetchConditionsListing()

const tablePadding = computed(() => {
  const style = sheet.value?.settings?.spacing ?? 'normal'
  if (style === 'compact') return 'p-1'
  if (style === 'cozy') return 'p-4'
  else return 'p-2'
})

const { mutateAsync: clearCombatEvents } = useCombatEventsClear()

const columns = generateColumns()
const tableData = shallowRef<InitiativeSheetRow[]>([])
const historyOpen = shallowRef<boolean>(false)
const summaryOpen = shallowRef<boolean>(false)

async function handleReset(hard: boolean): Promise<void> {
  reset(hard)
  summaryOpen.value = false

  if (props.encounterId)
    await clearCombatEvents({ encounterId: props.encounterId })
}

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
      :history-open="historyOpen"
      @reset="handleReset($event)"
      @previous="previous"
      @next="next"
      @toggle-history="historyOpen = !historyOpen"
      @end-encounter="summaryOpen = true"
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
                    class="data-[state=selected]:bg-muted-foreground/10 transition-colors duration-300"
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
