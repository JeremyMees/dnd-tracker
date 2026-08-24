import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { campaignTransferRole } from '~~/constants/validation'

const bodySchema = z.object({
  campaign: z.number().int().positive(),
  user: z.uuid(),
  role: z.enum(campaignTransferRole),
})

export default defineEventHandler(async event => {
  const supabase = serverSupabaseServiceRole<DB>(event)
  const caller = await requireUser(event)
  const body = await readValidatedBody(event, bodySchema.parse)

  await requireCampaignAccess(event, body.campaign, caller.id, ['Owner'])

  const { error } = await supabase.rpc('transfer_campaign_ownership', {
    p_campaign: body.campaign,
    p_caller: caller.id,
    p_new_owner: body.user,
    p_old_owner_role: body.role,
  })

  if (error) {
    if (error.code === 'P0001') {
      throw createError(
        postgresErrorToH3Error(error, {
          statusCode: 409,
          statusMessage: 'Conflict',
        }),
      )
    }

    throw createError(postgresErrorToH3Error(error))
  }
})
