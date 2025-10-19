<script setup lang="ts">
import type { ColumnDef, PaginationState, Row, SortingState, TableOptions } from '@tanstack/vue-table'
import { FlexRender, getCoreRowModel, getExpandedRowModel, useVueTable } from '@tanstack/vue-table'

const emit = defineEmits<{
  remove: [number[]]
  invalidate: []
}>()

const props = defineProps<{
  columns: ColumnDef<any, any>[]
  data: any[]
  loading: boolean
  options?: Partial<TableOptions<any>>
  emptyMessage?: string
  permission?: boolean | ((item: any) => Promise<boolean>)
  expandedMarkup?: (row: Row<any>) => VNode
}>()

const globalFilter = ref<string>('')
const sorting = ref<SortingState>(props.options?.initialState?.sorting || [])
const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 10 })
const rowSelectionPermissions = ref<Record<string, boolean>>({})

// Convert 0-based to 1-based for Radix
const internalPage = computed({
  get: () => pagination.value.pageIndex + 1,
  set: (value: number) => pagination.value.pageIndex = value - 1,
})

const selectedRowLength = computed(() => table.getSelectedRowModel().rows.length)

watch(
  () => props.data?.length,
  async (length) => {
    if (length) await fetchPermissions()
  },
  { immediate: true },
)

const table = useVueTable({
  ...props.options,
  data: computed(() => props.data),
  columns: props.columns,
  manualPagination: true,
  manualSorting: true,
  manualFiltering: true,
  enableRowSelection: (row: Row<any>) => rowSelectionPermissions.value[row.original.id] ?? false,
  getCoreRowModel: getCoreRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  getRowId: row => row.id,
  onSortingChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, sorting)
    pagination.value.pageIndex = 0
    emit('invalidate')
  },
  onGlobalFilterChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, globalFilter)
    pagination.value.pageIndex = 0
    emit('invalidate')
  },
  state: {
    get globalFilter() { return globalFilter.value },
    get pagination() { return pagination.value },
    get sorting() { return sorting.value },
  },
})

defineExpose({ vueTable: table })

async function fetchPermissions() {
  const permissions: Record<string, boolean> = {}

  for (const item of props.data) {
    if (typeof props.permission === 'boolean') permissions[item.id] = props.permission
    else if (typeof props.permission === 'function') permissions[item.id] = await props.permission(item)
    else permissions[item.id] = true
  }

  rowSelectionPermissions.value = permissions
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-col-reverse sm:flex-row gap-2 justify-between items-center">
      <FormKit
        :value="table.getState().globalFilter"
        type="search"
        name="search"
        prefix-icon="tabler:search"
        outer-class="$remove:mb-4 w-full sm:w-auto"
        inner-class="$remove:border-background $remove:bg-muted border-secondary bg-secondary/50"
        @input="table.setGlobalFilter($event)"
      />
      <div class="flex justify-end w-full sm:w-auto">
        <slot name="top" />
      </div>
    </div>

    <div class="rounded-lg border-4 border-secondary bg-secondary/50">
      <UiTable>
        <UiTableHeader>
          <UiTableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <UiTableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :data-pinned="header.column.getIsPinned()"
              :class="cn(
                { 'sticky bg-background/95': header.column.getIsPinned() },
                header.column.getIsPinned() === 'left' ? 'left-0' : 'right-0',
                header.column.getCanSort() ? 'cursor-pointer select-none' : '',
              )"
              @click="header.column.getToggleSortingHandler()?.($event)"
            >
              <ClientOnly>
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

                <template #fallback>
                  <FlexRender
                    v-if="!header.isPlaceholder"
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                </template>
              </ClientOnly>
            </UiTableHead>
          </UiTableRow>
        </UiTableHeader>

        <ClientOnly>
          <UiTableBody>
            <template v-if="table.getRowModel().rows?.length">
              <template
                v-for="row in table.getRowModel().rows"
                :key="row.id"
              >
                <UiTableRow :data-state="row.getIsSelected() && 'selected'">
                  <UiTableCell
                    v-for="cell in row.getVisibleCells()"
                    :key="cell.id"
                    :data-pinned="cell.column.getIsPinned()"
                    :class="cn(
                      { 'sticky bg-background/95': cell.column.getIsPinned() },
                      cell.column.getIsPinned() === 'left' ? 'left-0' : 'right-0',
                    )"
                  >
                    <FlexRender
                      :render="cell.column.columnDef.cell"
                      :props="cell.getContext()"
                    />
                  </UiTableCell>
                </UiTableRow>
                <UiTableRow v-if="expandedMarkup && row.getIsExpanded()">
                  <UiTableCell :colspan="row.getAllCells().length">
                    <FlexRender :render="expandedMarkup(row)" />
                  </UiTableCell>
                </UiTableRow>
              </template>
            </template>

            <slot
              v-else-if="loading"
              name="loading"
            />

            <UiTableRow v-else>
              <UiTableCell
                data-test-empty
                :colspan="columns.length"
                class="h-24 text-center text-muted-foreground"
              >
                {{ emptyMessage || '' }}
              </UiTableCell>
            </UiTableRow>
          </UiTableBody>

          <template #fallback>
            <UiTableBody>
              <slot name="loading" />
            </UiTableBody>
          </template>
        </ClientOnly>
      </UiTable>

      <div
        :class="[selectedRowLength ? 'flex-col md:flex-row justify-between' : 'justify-end']"
        class="p-4 border-t border-secondary flex items-center gap-2"
      >
        <div
          v-if="selectedRowLength"
          class="text-sm text-muted-foreground"
        >
          {{
            $t('components.pagination.selected', {
              selected: selectedRowLength,
              items: data?.length || 0,
            })
          }}
        </div>

        <ClientOnly>
          <UiPagination
            v-model:page="internalPage"
            :data-test-pagination="internalPage"
            :total="Math.max(1, (options?.pageCount || 0) * pagination.pageSize)"
            :items-per-page="pagination.pageSize"
            :disabled="loading"
            class="flex items-center gap-6 w-fit"
          >
            <div class="text-sm text-muted-foreground">
              {{
                $t('components.pagination.page', {
                  page: internalPage,
                  pages: Math.max(1, options?.pageCount || 0),
                })
              }}
            </div>
            <div class="flex items-center border-4 border-foreground bg-foreground/50 rounded-lg text-background">
              <UiPaginationFirst
                :disabled="!table.getCanPreviousPage()"
                class="border-0 border-r rounded-r-none border-r-foreground"
              />
              <UiPaginationPrev
                data-test-pagination-prev
                :disabled="!table.getCanPreviousPage()"
                class="border-0 border-r rounded-r-none border-r-foreground"
              />
              <UiPaginationNext
                data-test-pagination-next
                :disabled="!table.getCanNextPage() || (options?.pageCount && options.pageCount <= 1)"
                class="border-0 border-r rounded-r-none border-r-foreground"
              />
              <UiPaginationLast
                :disabled="!table.getCanNextPage() || (options?.pageCount && options.pageCount <= 1)"
                class="border-0"
              />
            </div>
          </UiPagination>

          <template #fallback>
            <div class="flex items-center gap-6 w-fit">
              <UiSkeleton class="w-16 h-5 rounded-full" />
              <UiSkeleton class="w-[136px] h-10" />
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>

    <AnimationReveal>
      <button
        v-if="selectedRowLength"
        data-test-remove
        class="btn-destructive mt-2"
        :aria-label="$t('actions.bulkRemove', { number: selectedRowLength }, selectedRowLength)"
        @click="$emit('remove', table.getSelectedRowModel().rows.map(row => row.original.id))"
      >
        {{ $t('actions.bulkRemove', { number: selectedRowLength }, selectedRowLength) }}
      </button>
    </AnimationReveal>
  </div>
</template>
