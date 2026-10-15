import type { RowData, Table } from '@tanstack/vue-table'
import type {
  homebrewSelectFeatures,
  initiativeFeatures,
  listingFeatures,
} from '~/tables/features'

export type ListingFeatures = typeof listingFeatures
export type InitiativeFeatures = typeof initiativeFeatures
export type HomebrewSelectFeatures = typeof homebrewSelectFeatures

export interface DataTableExposed<TData extends RowData = { id: number }> {
  vueTable: Table<ListingFeatures, TData>
}
