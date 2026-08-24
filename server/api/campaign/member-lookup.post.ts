import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'

const bodySchema = z.object({
  campaign: z.number().int().positive(),
  email: z.email().max(254),
})

export default defineEventHandler(async event => {
  const supabase = serverSupabaseServiceRole<DB>(event)
  const caller = await requireUser(event)
  const body = await readValidatedBody(event, bodySchema.parse)

  await requireCampaignAccess(event, body.campaign, caller.id, [
    'Owner',
    'Admin',
  ])

  await assertRateLimit(event, {
    key: 'campaign-member-lookup',
    limit: 20,
    windowMs: 60_000,
  })

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar')
    .ilike('email', escapeLikePattern(body.email))
    .limit(1)

  if (error) throw createError(postgresErrorToH3Error(error))

  return data[0] ?? null
})
