<script setup lang="ts">
import { FlexRender, getCoreRowModel, getExpandedRowModel, useVueTable } from '@tanstack/vue-table'
import { generateColumns, expandedMarkup } from '~/tables/initiative-sheet'

const props = defineProps<{
  data: InitiativeSheet | undefined
  loading: boolean
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable>) => Promise<void>
}>()

onKeyStroke(['ArrowLeft', 'ArrowRight', 'Enter'], (e) => {
  e.preventDefault()

  if ((!e.shiftKey && !e.metaKey) || !props.data) return

  const current = props.data.rows[props.data.activeIndex].id

  if (e.key === 'Enter') {
    if (current in expanded.value) delete expanded.value[current]
    else expanded.value[current] = true
  }
  else if (e.key === 'ArrowLeft') previous()
  else if (e.key === 'ArrowRight') next()
})

const tablePadding = computed(() => {
  const style = props.data?.settings.spacing
  if (style === 'compact') return 'p-1'
  if (style === 'cozy') return 'p-4'
  else return 'p-2'
})

const columns = generateColumns({
  sheet: computed(() => props.data),
  update: props.update,
  openQuickInitModal: () => console.log('open quick init modal'),
})

const expanded = ref<Record<string, boolean>>({})
const selected = ref<Record<string, boolean>>({})

watch( // This is a hack otherwise the table doesn't update when the data changes
  () => props.data?.rows,
  () => {
    expanded.value = {}

    if (props.data?.rows.length) {
      const active = props.data.activeIndex

      selected.value = props.data.rows[active]
        ? { [props.data.rows[active].id]: true }
        : { [props.data.rows[0].id]: true }
    }
  },
  { immediate: true },
)

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
  },
})

function previous(): void {
  if (!props.data) return

  const isAtStart = props.data.activeIndex === 0
  const activeIndex = isAtStart ? props.data.rows.length - 1 : props.data.activeIndex - 1
  const round = isAtStart ? props.data.round - 1 : props.data.round

  props.update({ activeIndex, round })
  selected.value = { [props.data.rows[activeIndex].id]: true }
}

function next(): void {
  if (!props.data) return

  const isAtEnd = props.data.activeIndex + 1 >= props.data.rows.length
  const activeIndex = isAtEnd ? 0 : props.data.activeIndex + 1
  const round = isAtEnd ? props.data.round + 1 : props.data.round

  props.update({ activeIndex, round })
  selected.value = { [props.data.rows[activeIndex].id]: true }
}

function reset(hard: boolean): void {
  if (!props.data) return

  let update: Omit<Partial<InitiativeSheet>, NotUpdatable> = { activeIndex: 0, round: 1 }

  if (hard) {
    update = {
      ...update,
      rows: props.data.rows.map(row => ({
        ...row,
        initiative: -1,
        conditions: [],
        ...(row.concentration !== undefined && { concentration: false }),
        ...(row.deathSaves !== undefined && {
          deathSaves: {
            fail: [false, false, false],
            save: [false, false, false],
          },
        }),
        ...(row.ac !== undefined && { ac: row.maxAcOld || row.maxAc }),
        ...(row.health !== undefined && { health: row.maxHealthOld || row.maxHealth }),
        tempAc: undefined,
        maxAcOld: undefined,
        tempHealth: undefined,
        maxHealthOld: undefined,
      })),
    }
  }

  props.update(update)
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
              v-for="row in table.getRowModel().rows"
              :key="row.id"
            >
              <UiTableRow
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
            />
          </template>

          <UiTableRow v-else>
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
