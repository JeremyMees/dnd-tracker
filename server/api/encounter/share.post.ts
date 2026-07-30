import { TimeSpan } from 'oslo'
import { createJWT } from 'oslo/jwt'
import { serverSupabaseServiceRole } from '#supabase/server'
import * as z from 'zod'

const bodySchema = z.object({
  encounter: z.number().int().positive(),
})

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const secret = useRuntimeConfig().jwtSecret

  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: encounter } = await supabase
    .from('initiative_sheets')
    .select('id, campaign, createdBy')
    .eq('id', body.encounter)
    .single()

  if (!encounter) {
    throw createError({ statusCode: 404, statusMessage: 'Encounter not found' })
  }

  if (encounter.createdBy !== user.id) {
    if (!encounter.campaign) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    await requireCampaignAccess(event, encounter.campaign, user.id)
  }

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
