import * as z from 'zod'
import { open5eContentTypes, open5eSortOptions } from '~~/constants/dnd'

const PAGE_SIZE = 20

const querySchema = z.object({
  type: z.enum(open5eContentTypes),
  page: z.coerce.number().int().min(0).max(10_000).default(0),
  search: z.string().trim().max(100).default(''),
  documents: z.string().trim().max(500).default(''),
  ordering: z.enum(open5eSortOptions).default('name'),
  cr: z.coerce.number().min(0).max(100).optional(),
})

export default defineEventHandler(
  async (event): Promise<Open5eListingResult> => {
    const query = await getValidatedQuery(event, querySchema.parse)

    const documents = query.documents
      .split(',')
      .map(key => key.trim())
      .filter(Boolean)

    setCacheHeaders(event, FILTERED_LIST_CACHE)

    if (!documents.length) return narrowListing(query.type, [], 0)

    return srdListing(event, { ...query, documents }, PAGE_SIZE)
  },
)
