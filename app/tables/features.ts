import {
  columnFilteringFeature,
  columnPinningFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  createFilteredRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
} from '@tanstack/vue-table'

export const listingFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  columnPinningFeature,
  columnVisibilityFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  expandedRowModel: createExpandedRowModel(),
})

export const initiativeFeatures = tableFeatures({
  columnVisibilityFeature,
  rowExpandingFeature,
  rowSelectionFeature,
  expandedRowModel: createExpandedRowModel(),
})

export const homebrewSelectFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  columnVisibilityFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
})

export type ListingFeatures = typeof listingFeatures
export type InitiativeFeatures = typeof initiativeFeatures
export type HomebrewSelectFeatures = typeof homebrewSelectFeatures
