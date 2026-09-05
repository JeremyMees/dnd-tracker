export default defineEventHandler(async (event): Promise<DndDocument[]> => {
  setCacheHeaders(event, STATIC_LIST_CACHE)

  return srdDocuments(event)
})
