import { gameSystems } from '~~/constants/dnd'

const PAGE_SIZE = 100
const MAX_PAGES = 5

async function fetchAllDocuments(): Promise<Open5eDocument[]> {
  const documents: Open5eDocument[] = []

  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await fetchOpen5e<Open5eDocument>('documents', {
      page,
      limit: PAGE_SIZE,
      ordering: '-publication_date',
    })

    if (!response.results.length) break

    documents.push(...response.results)

    if (documents.length >= response.count) break
  }

  return documents
}

export default defineEventHandler(async (event): Promise<Open5eDocument[]> => {
  return withOpen5eFallback(
    event,
    { key: 'documents', tier: STATIC_LIST_CACHE },
    async () => {
      const documents = await fetchAllDocuments()

      return documents.filter(document =>
        gameSystems.includes(document.gamesystem.key),
      )
    },
  )
})
