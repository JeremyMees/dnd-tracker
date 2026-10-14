export interface SrdListingQuery {
  type: DndContentType
  page: number
  search: string
  documents: string[]
  ordering: DndSortBy
  cr?: number
}
