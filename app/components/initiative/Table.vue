<script setup lang="ts">
import { FlexRender, getCoreRowModel, getExpandedRowModel, useVueTable } from '@tanstack/vue-table'
import { generateColumns, expandedMarkup } from '~~/tables/initiative-sheet'
import { prefetchConditionsListing } from '~~/queries/open5e'

const props = defineProps<{
  data: InitiativeSheet | undefined
  loading: boolean
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable>) => Promise<void>
}>()

const {
  previous,
  next,
  reset,
  expanded,
  selected,
  columnVisibility,
} = useInitiativeSheet(computed(() => props.data), props.update)

prefetchConditionsListing()

const tablePadding = computed(() => {
  const style = props.data?.settings?.spacing ?? 'normal'
  if (style === 'compact') return 'p-1'
  if (style === 'cozy') return 'p-4'
  else return 'p-2'
})

const columns = generateColumns({
  sheet: computed(() => props.data),
  update: props.update,
})

const table = useVueTable({
  data: computed(() => props.data?.rows || []),
  columns,
  getCoreRowModel: getCoreRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  getRowId: row => row.id.toString(),
  onExpandedChange: updaterOrValue => valueUpdater(updaterOrValue, expanded),
  onRowSelectionChange: updaterOrValue => valueUpdater(updaterOrValue, selected),
  state: {
    get expanded() { return expanded.value },
    get rowSelection() { return selected.value },
    get columnVisibility() { return columnVisibility.value },
  },
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <InitiativeHeader
      :data="data"
      @reset="reset($event)"
      @previous="previous"
      @next="next"
    />

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
              :class="tablePadding"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
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
                :data-state="selected[row.id] && 'selected'"
                class="data-[state=selected]:bg-muted-foreground/10 transition-colors duration-300"
              >
                <UiTableCell
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  :class="tablePadding"
                >
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </UiTableCell>
              </UiTableRow>
              <UiTableRow v-if="row.getIsExpanded()">
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
              :class="tablePadding"
            />
          </template>

          <UiTableRow v-else>
            <UiTableCell
              :colspan="columns.length"
              class="md:p-10"
            >
              <InitiativeTableEmptyState :campaign="!!data?.campaign" />
            </UiTableCell>
          </UiTableRow>
        </UiTableBody>
      </UiTable>
    </div>

    <LazyInitiativeWidgets
      hydrate-on-visible
      :sheet="data"
      :update="update"
    />
  </div>
</template>
