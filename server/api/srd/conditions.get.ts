const CORE_DOCUMENT = 'core'

export default defineEventHandler(async (event): Promise<DndCondition[]> => {
  setCacheHeaders(event, STATIC_LIST_CACHE)

  return srdConditions(event, CORE_DOCUMENT)
})
