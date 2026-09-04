const CORE_DOCUMENTS = 'core'
const PREFERRED_DOCUMENTS = ['srd-2024']

export default defineEventHandler(async (event): Promise<DndCondition[]> => {
  return withOpen5eFallback(
    event,
    { key: `conditions:${CORE_DOCUMENTS}`, tier: STATIC_LIST_CACHE },
    async () => {
      const response = await fetchOpen5e<Open5eCondition>('conditions', {
        page: 1,
        document__key__in: CORE_DOCUMENTS,
      })

      return response.results.map(condition =>
        toCondition(condition, PREFERRED_DOCUMENTS),
      )
    },
  )
})
