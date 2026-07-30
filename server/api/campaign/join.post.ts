import { TimeSpan } from 'oslo'
import { createJWT } from 'oslo/jwt'
import * as z from 'zod'

const bodySchema = z.object({
  campaign: z.number().int().positive(),
  user: z.uuid(),
  role: z.enum(['Admin', 'Player', 'Viewer']),
})

export default defineEventHandler(async event => {
  const caller = await requireUser(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const secret = useRuntimeConfig().jwtSecret

  await requireCampaignAccess(event, body.campaign, caller.id, [
    'Owner',
    'Admin',
  ])

  return await createJWT(
    'HS256',
    new TextEncoder().encode(secret),
    {
      user: caller.id,
      data: body,
    },
    {
      expiresIn: new TimeSpan(1, 'w'),
      includeIssuedTimestamp: true,
    },
  )
})
