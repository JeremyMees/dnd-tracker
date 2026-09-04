const CORE_DOCUMENTS = 'core'
const PREFERRED_DOCUMENTS = ['srd-2024']

export default defineEventHandler(async (event): Promise<DndCondition[]> => {
  const response = await fetchOpen5e<Open5eCondition>('conditions', {
    page: 1,
    document__key__in: CORE_DOCUMENTS,
  })

  const conditions = response.results.map(condition =>
    toCondition(condition, PREFERRED_DOCUMENTS),
  )

  setCacheHeaders(event, STATIC_LIST_CACHE)

  return conditions
})
