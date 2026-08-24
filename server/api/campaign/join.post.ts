import * as z from 'zod'
import { ONE_WEEK } from '~~/constants/time'

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

  return await signJWT(
    secret,
    {
      user: caller.id,
      data: body,
    },
    new Date(Date.now() + ONE_WEEK),
  )
})
