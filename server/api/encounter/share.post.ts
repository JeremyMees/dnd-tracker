import * as z from 'zod'
import { ONE_WEEK } from '~~/constants/time'

const bodySchema = z.object({
  encounter: z.number().int().positive(),
})

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const secret = useRuntimeConfig().jwtSecret

  const encounter = await requireEncounterAccess(event, body.encounter, user.id)

  return await signJWT(
    secret,
    {
      user: user.id,
      encounter: encounter.id,
    },
    new Date(Date.now() + ONE_WEEK),
  )
})
