<script setup lang="ts">
import { FlexRender, getCoreRowModel, getExpandedRowModel, useVueTable } from '@tanstack/vue-table'
import { generateColumns, expandedMarkup } from '~/tables/initiative-sheet'

const props = defineProps<{
  data: InitiativeSheet
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable>) => Promise<void>
}>()

onKeyStroke(['ArrowLeft', 'ArrowRight', 'Enter'], (e) => {
  e.preventDefault()

  if (!e.shiftKey && !e.metaKey) return

  const current = props.data.rows[props.data.activeIndex].id

  if (e.key === 'Enter') {
    if (current in expanded.value) delete expanded.value[current]
    else expanded.value[current] = true
  }
  else if (e.key === 'ArrowLeft') previous()
  else if (e.key === 'ArrowRight') next()
})

const columns = generateColumns({
  sheet: computed(() => props.data),
  update: props.update,
})

const expanded = ref<Record<string, boolean>>({})
const selected = ref<Record<string, boolean>>({})

if (props.data.rows.length) {
  const active = props.data.activeIndex

  selected.value = props.data.rows[active]
    ? { [props.data.rows[active].id]: true }
    : { [props.data.rows[0].id]: true }
}

const table = useVueTable({
  data: computed(() => props.data.rows),
  columns,
  getCoreRowModel: getCoreRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  getRowId: row => row.id.toString(),
  onExpandedChange: updaterOrValue => valueUpdater(updaterOrValue, expanded),
  onRowSelectionChange: updaterOrValue => valueUpdater(updaterOrValue, selected),
  state: {
    get expanded() { return expanded.value },
    get rowSelection() { return selected.value },
  },
})

function previous(): void {
  const isAtStart = props.data.activeIndex === 0
  const activeIndex = isAtStart ? props.data.rows.length - 1 : props.data.activeIndex - 1
  const round = isAtStart ? props.data.round - 1 : props.data.round

  props.update({ activeIndex, round })
  selected.value = { [props.data.rows[activeIndex].id]: true }
}

function next(): void {
  const isAtEnd = props.data.activeIndex + 1 >= props.data.rows.length
  const activeIndex = isAtEnd ? 0 : props.data.activeIndex + 1
  const round = isAtEnd ? props.data.round + 1 : props.data.round

  props.update({ activeIndex, round })
  selected.value = { [props.data.rows[activeIndex].id]: true }
}

function reset(): void {
  props.update({ activeIndex: 0, round: 1 })
  selected.value = { [props.data.rows[0].id]: true }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <InitiativeHeader
      :data="data"
      @reset="reset"
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
              v-for="row in table.getRowModel().rows"
              :key="row.id"
            >
              <UiTableRow
                :data-state="row.getIsSelected() && 'selected'"
                class="hover:bg-transparent"
              >
                <UiTableCell
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                >
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </UiTableCell>
              </UiTableRow>
              <UiTableRow
                v-if="row.getIsExpanded()"
                class="hover:bg-transparent"
              >
                <UiTableCell :colspan="row.getAllCells().length">
                  <FlexRender :render="expandedMarkup(row)" />
                </UiTableCell>
              </UiTableRow>
            </template>
          </template>

          <UiTableRow
            v-else
            class="hover:bg-transparent"
          >
            <UiTableCell
              :colspan="columns.length"
              class="md:p-10"
            >
              <InitiativeTableEmptyState />
            </UiTableCell>
          </UiTableRow>
        </UiTableBody>
      </UiTable>
    </div>
  </div>
</template>
