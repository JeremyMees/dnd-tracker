import { z } from 'zod'
import { races, genders } from '~~/constants/names'
import { ONE_MINUTE } from '~~/constants/time'

const MAX_AMOUNT = 50

const querySchema = z.object({
  race: z.enum(races).optional(),
  gender: z.enum(genders).optional(),
  amount: z.coerce.number().int().min(1).max(MAX_AMOUNT).default(1),
})

export default defineEventHandler(async (event): Promise<string[]> => {
  await assertRateLimit(event, {
    key: 'names',
    limit: 60,
    windowMs: ONE_MINUTE,
  })

  const { race, gender, amount } = await getValidatedQuery(
    event,
    querySchema.parse,
  )

  setHeader(event, 'Cache-Control', 'no-store')

  return randomNames(amount, race, gender)
})
