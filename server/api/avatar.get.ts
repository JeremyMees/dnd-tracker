import * as z from 'zod'
import type { Avatar } from '~~/shared/types/avatar'

const querySchema = z.record(
  z.string().max(50),
  z.union([z.string().max(50), z.number()]),
)

export default defineEventHandler(async (event): Promise<Avatar> => {
  const query = await getValidatedQuery(event, querySchema.parse)

  setCacheHeaders(event, GENERATED_ASSET_CACHE)

  return generateAvatar(normalizeStyleOptions(query))
})
