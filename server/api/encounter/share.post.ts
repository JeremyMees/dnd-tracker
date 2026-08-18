import { TimeSpan } from 'oslo'
import { createJWT } from 'oslo/jwt'
import * as z from 'zod'

const bodySchema = z.object({
  encounter: z.number().int().positive(),
})

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const secret = useRuntimeConfig().jwtSecret

  const encounter = await requireEncounterAccess(event, body.encounter, user.id)

  return await createJWT(
    'HS256',
    new TextEncoder().encode(secret),
    {
      user: user.id,
      encounter: encounter.id,
    },
    {
      expiresIn: new TimeSpan(1, 'w'),
      includeIssuedTimestamp: true,
    },
  )
})
