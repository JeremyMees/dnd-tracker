<script setup lang="ts">
import type { Row, RowSelectionState, SortingState } from '@tanstack/vue-table'
import { FlexRender, useTable } from '@tanstack/vue-table'
import {
  type HomebrewSelectFeatures,
  homebrewSelectFeatures,
} from '~/tables/features'
import { generateColumns, initialState } from '~/tables/homebrew-select-listing'
import { useHomebrewListing } from '~/queries/homebrews'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const emit = defineEmits<{ close: [] }>()

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const globalFilter = ref<string>('')
const sorting = ref<SortingState>(initialState?.sorting || [])
const rowSelection = ref<RowSelectionState>({})
const summoner = ref<{ name: string; id: string }>()

const selected = computed<HomebrewItemRow[]>(
  () => data.value?.homebrews.filter(({ id }) => rowSelection.value[id]) || [],
)
const summons = computed<HomebrewItemRow[]>(
  () => selected.value?.filter(s => s.type === 'summon') || [],
)

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
  } else return []
})

const columns = generateColumns()

const table = useTable({
  features: homebrewSelectFeatures,
  data: computed(() => data.value?.homebrews || []),
  columns,
  enableRowSelection: (row: Row<HomebrewSelectFeatures, HomebrewItemRow>) =>
    summons.value.length ? row.original.type === 'summon' : true,
  getRowId: (row: HomebrewItemRow) => row.id.toString(),
  onSortingChange: updaterOrValue => valueUpdater(updaterOrValue, sorting),
  onGlobalFilterChange: updaterOrValue =>
    valueUpdater(updaterOrValue, globalFilter),
  onRowSelectionChange: updaterOrValue => {
    const value =
      typeof updaterOrValue === 'function'
        ? updaterOrValue(rowSelection.value)
        : updaterOrValue

    const selection = data.value?.homebrews.filter(({ id }) => value[id]) || []
    const summons = selection.filter(s => s.type === 'summon')

    rowSelection.value = summons.length
      ? Object.fromEntries(
          summons.filter(s => value[s.id]).map(s => [s.id, true]),
        )
      : value
  },
  state: {
    get globalFilter() {
      return globalFilter.value
    },
    get sorting() {
      return sorting.value
    },
    get rowSelection() {
      return rowSelection.value
    },
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
    const { id: _id, ...rest } = hb

    const row: Partial<InitiativeSheetRow> & { name: string } = {
      ...nullsToUndefined(rest),
      initiativeModifier: hb.initiativeModifier
        ? Number(hb.initiativeModifier)
        : undefined,
      ...(hb.type === 'summon' && summoner.value
        ? { summoner: summoner.value }
        : {}),
    }

    rows.push(createInitiativeRow(row, hb.type, rows.length))
  })

  const sortedRows = indexCorrect(rows)

  await update({ rows: sortedRows })

  emit('close')
}
</script>

<template>
  <div class="min-h-0 flex-1 flex flex-col gap-4">
    <UiInputGroup>
      <UiInputGroupInput v-model="globalFilter" name="search" type="search" />
      <UiInputGroupAddon align="inline-end">
        <Icon name="tabler:search" class="size-3" :aria-hidden="true" />
      </UiInputGroupAddon>
    </UiInputGroup>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <UiTable>
        <UiTableHeader>
          <UiTableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
            class="border-b border-muted"
          >
            <UiTableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :test-id="`header-${header.id}`"
              class="px-2"
              :class="
                cn(
                  header.column.getCanSort()
                    ? 'cursor-pointer select-none'
                    : '',
                )
              "
              @click="header.column.getToggleSortingHandler()?.($event)"
            >
              <div
                class="flex items-center gap-2 w-fit"
                :class="{
                  'bg-muted rounded-lg p-2 transition-all duration-300 text-foreground':
                    header.column.getIsSorted(),
                }"
              >
                <FlexRender v-if="!header.isPlaceholder" :header="header" />
                <Icon
                  v-if="header.column.getIsSorted()"
                  :name="
                    header.column.getIsSorted() === 'asc'
                      ? 'tabler:sort-ascending'
                      : 'tabler:sort-descending'
                  "
                  class="size-4"
                />
              </div>
            </UiTableHead>
          </UiTableRow>
        </UiTableHeader>

        <UiTableBody>
          <template v-if="table.getRowModel().rows?.length">
            <template v-for="row in table.getRowModel().rows" :key="row.id">
              <UiTableRow
                :data-state="row.getIsSelected() && 'selected'"
                class="border-b border-muted"
              >
                <UiTableCell
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  class="p-2"
                >
                  <FlexRender :cell="cell" />
                </UiTableCell>
              </UiTableRow>
            </template>
          </template>

          <template v-else-if="isPending">
            <SkeletonHomebrewSelectTableRow v-for="i in 10" :key="i" />
          </template>

          <UiTableRow v-else>
            <UiTableCell :colspan="columns.length" class="h-24 text-center">
              {{
                $t('components.table.nothing', {
                  item: $t('general.homebrew', 2).toLowerCase(),
                })
              }}
            </UiTableCell>
          </UiTableRow>
        </UiTableBody>
      </UiTable>
    </div>

    <div v-if="!!summons.length" class="space-y-2">
      <UiLabel for="summoner" required>
        {{ $t('components.inputs.summonerLabel') }}
      </UiLabel>
      <UiSelect
        id="summoner"
        name="summoner"
        @update:model-value="
          value => {
            if (value) {
              const filtered = sheet?.rows.find(s => s.id === value)
              summoner = filtered
                ? { name: filtered.name, id: filtered.id }
                : undefined
            }
          }
        "
      >
        <UiSelectTrigger>
          <UiSelectValue
            :placeholder="$t('components.campaignHomebrew.initiative.select')"
          />
        </UiSelectTrigger>
        <UiSelectContent>
          <UiSelectGroup>
            <UiSelectItem
              v-for="option in summonersOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </UiSelectItem>
          </UiSelectGroup>
        </UiSelectContent>
      </UiSelect>
      <p class="text-sm text-muted-foreground">
        {{ $t('components.campaignHomebrew.initiative.info') }}
      </p>
    </div>

    <div class="flex gap-2 flex-wrap">
      <template v-if="!summons.length">
        <UiButton
          :aria-label="$t('actions.addSelected')"
          :disabled="isPending || !selected.length"
          class="flex-1"
          @click="addHomebrews(false)"
        >
          {{ $t('actions.addSelected') }} ({{ selected.length }})
        </UiButton>
        <UiButton
          variant="foreground"
          :aria-label="$t('actions.addAll')"
          :disabled="isPending"
          class="flex-1"
          @click="addHomebrews(true)"
        >
          {{ $t('actions.addAll') }}
        </UiButton>
      </template>
      <UiButton
        v-else
        variant="foreground"
        :aria-label="
          $t('components.campaignHomebrew.initiative.add', summons.length)
        "
        :disabled="isPending || !summoner"
        class="flex-1"
        @click="addHomebrews(false)"
      >
        {{ $t('components.campaignHomebrew.initiative.add', summons.length) }}
      </UiButton>
    </div>
  </div>
</template>
