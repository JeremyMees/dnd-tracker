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

type ListingQuery = z.infer<typeof querySchema>

function listingKey(query: ListingQuery, documents: string[]): string {
  return [
    'listing',
    query.type,
    query.page,
    query.ordering,
    query.cr ?? '',
    documents.join('+'),
    query.search.toLowerCase(),
  ].join(':')
}

export default defineEventHandler(
  async (event): Promise<Open5eListingResult> => {
    const query = await getValidatedQuery(event, querySchema.parse)

    const documents = query.documents
      .split(',')
      .map(key => key.trim())
      .filter(Boolean)

    if (!documents.length) {
      setCacheHeaders(event, FILTERED_LIST_CACHE)

      return narrowListing(query.type, [], 0)
    }

    return withOpen5eFallback(
      event,
      { key: listingKey(query, documents), tier: FILTERED_LIST_CACHE },
      async () => {
        const response = await fetchOpen5e<Open5eItem>(query.type, {
          limit: PAGE_SIZE,
          page: query.page + 1,
          ordering: query.ordering,
          name__icontains: query.search,
          document__key__in: documents.join(','),
          ...(query.cr === undefined
            ? {}
            : {
                challenge_rating__gte: query.cr,
                challenge_rating__lte: query.cr,
              }),
        })

        const items = response.results.map(item =>
          transformOpen5eItem(query.type, item),
        )

        return narrowListing(
          query.type,
          items,
          Math.ceil(response.count / PAGE_SIZE),
        )
      },
    )
  },
)
