<script setup lang="ts">
import type { Row, SortingState } from '@tanstack/vue-table'
import { FlexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useVueTable } from '@tanstack/vue-table'
import { generateColumns, initialState } from '~~/tables/homebrew-select-listing'
import { useHomebrewListing } from '~~/queries/homebrews'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const emit = defineEmits<{ close: [] }>()

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const globalFilter = ref<string>('')
const sorting = ref<SortingState>(initialState?.sorting || [])
const rowSelection = ref<Record<string, boolean>>({})
const summoner = ref<{ name: string, id: string }>()

const selected = computed<HomebrewItemRow[]>(() => data.value?.homebrews.filter(({ id }) => rowSelection.value[id]) || [])
const summons = computed<HomebrewItemRow[]>(() => selected.value?.filter(s => s.type === 'summon') || [])

const { data, isPending } = useHomebrewListing(
  computed(() => {
    const campaign = sheet.value?.campaign?.id

    return {
      eq: campaign
        ? { field: 'campaign', value: campaign }
        : { field: 'id', value: -1 },
    }
  }),
  computed(() => !!sheet.value?.campaign?.id),
  100,
)

const summonersOptions = computed<Option<string>[]>(() => {
  if (sheet.value?.rows) {
    return sheet.value.rows
      .filter(r => r.type !== 'summon')
      .map(o => ({ label: o.name, value: o.id }))
  }
  else return []
})

const columns = generateColumns()

const table = useVueTable({
  data: computed(() => data.value?.homebrews || []),
  columns,
  enableRowSelection: (row: Row<HomebrewItemRow>) => summons.value.length ? row.original.type === 'summon' : true,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getRowId: row => row.id.toString(),
  onSortingChange: updaterOrValue => valueUpdater(updaterOrValue, sorting),
  onGlobalFilterChange: updaterOrValue => valueUpdater(updaterOrValue, globalFilter),
  onRowSelectionChange: (updaterOrValue) => {
    const value = typeof updaterOrValue === 'function'
      ? updaterOrValue(rowSelection.value)
      : updaterOrValue

    const selection = data.value?.homebrews.filter(({ id }) => value[id]) || []
    const summons = selection.filter(s => s.type === 'summon')

    rowSelection.value = summons.length
      ? Object.fromEntries(summons.map(s => [s.id, value[s.id] || false]))
      : value
  },
  state: {
    get globalFilter() { return globalFilter.value },
    get sorting() { return sorting.value },
    get rowSelection() { return rowSelection.value },
  },
  globalFilterFn: (row, _columnId, filterValue) => {
    const searchValue = filterValue.toLowerCase()
    const name = row.getValue<string>('name')?.toLowerCase() || ''
    const player = row.getValue<string | null>('player')?.toLowerCase() || ''

    return name.includes(searchValue) || player.includes(searchValue)
  },
})

async function addHomebrews(addAll: boolean): Promise<void> {
  if (!sheet.value) return

  const rows = [...sheet.value.rows]
  const selection = addAll
    ? data.value?.homebrews.filter(hb => hb.type !== 'summon') || []
    : selected.value

  selection.forEach((hb: HomebrewItemRow) => {
    const row: Partial<InitiativeSheetRow> & { name: string } = {
      ac: hb.ac || undefined,
      health: hb.health || undefined,
      name: hb.name,
      initiative: undefined,
      initiative_modifier: hb.initiative_modifier ? Number(hb.initiative_modifier) : undefined,
      actions: hb.actions || [],
      legendary_actions: hb.legendary_actions || [],
      reactions: hb.reactions || [],
      special_abilities: hb.special_abilities || [],
      ...(hb.type === 'summon' && summoner.value ? { summoner: summoner.value } : {}),
    }

    rows.push(createInitiativeRow(row, hb.type, rows.length))
  })

  const sortedRows = indexCorrect(rows)

  await update({ rows: sortedRows })

  emit('close')
}
</script>

<template>
  <div class="max-h-full flex flex-col gap-4">
    <FormKit
      :value="table.getState().globalFilter"
      type="search"
      name="search"
      prefix-icon="tabler:search"
      outer-class="$remove:mb-4 w-full"
      @input="table.setGlobalFilter($event)"
    />

    <UiTable>
      <UiTableHeader>
        <UiTableRow
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
          class="border-b border-muted-foreground"
        >
          <UiTableHead
            v-for="header in headerGroup.headers"
            :key="header.id"
            class="px-2"
            :class="cn(
              header.column.getCanSort() ? 'cursor-pointer select-none' : '',
            )"
            @click="header.column.getToggleSortingHandler()?.($event)"
          >
            <div
              class="flex items-center gap-2 w-fit"
              :class="{
                'bg-muted rounded-lg p-2 transition-all duration-300 text-foreground': header.column.getIsSorted(),
              }"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
              <Icon
                v-if="header.column.getIsSorted()"
                :name="`tabler:sort-${header.column.getIsSorted() === 'asc' ? 'ascending' : 'descending'}`"
                class="size-4"
              />
            </div>
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
              class="border-b border-muted-foreground"
            >
              <UiTableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="p-2"
              >
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </UiTableCell>
            </UiTableRow>
          </template>
        </template>

        <template v-else-if="isPending">
          <SkeletonHomebrewSelectTableRow
            v-for="i in 10"
            :key="i"
          />
        </template>

        <UiTableRow v-else>
          <UiTableCell
            :colspan="columns.length"
            class="h-24 text-center"
          >
            {{ $t('components.table.nothing', { item: $t('general.homebrew', 2).toLowerCase() }) }}
          </UiTableCell>
        </UiTableRow>
      </UiTableBody>
    </UiTable>

    <FormKit
      v-if="!!summons.length"
      type="select"
      :label="$t('components.inputs.summonerLabel')"
      :placeholder="$t('components.campaignHomebrew.initiative.select')"
      :help="$t('components.campaignHomebrew.initiative.info')"
      :options="summonersOptions"
      @input="(value) => {
        if (value) {
          const filtered = sheet?.rows.find(s => s.id === value)
          summoner = filtered ? { name: filtered.name, id: filtered.id } : undefined
        }
      }"
    />

    <div class="flex gap-2 flex-wrap justify-end">
      <template v-if="!summons.length">
        <button
          class="btn-primary"
          :aria-label="$t('actions.addSelected')"
          :disabled="isPending || !selected.length"
          @click="addHomebrews(false)"
        >
          {{ $t('actions.addSelected') }} ({{ selected.length }})
        </button>
        <button
          class="btn-foreground"
          :aria-label="$t('actions.addAll')"
          :disabled="isPending"
          @click="addHomebrews(true)"
        >
          {{ $t('actions.addAll') }}
        </button>
      </template>
      <button
        v-else
        class="btn-foreground"
        :aria-label="$t('components.campaignHomebrew.initiative.add', summons.length)"
        :disabled="isPending || !summoner"
        @click="addHomebrews(false)"
      >
        {{ $t('components.campaignHomebrew.initiative.add', summons.length) }}
      </button>
    </div>
  </div>
</template>
