import { serverSupabaseServiceRole } from '#supabase/server'
import * as z from 'zod'

const bodySchema = z.object({
  token: z.string().min(1).max(2048),
})

export default defineEventHandler(async event => {
  const supabase = serverSupabaseServiceRole<DB>(event)
  const user = await requireUser(event)
  const { token } = await readValidatedBody(event, bodySchema.parse)

  const { data: joinCampaign, error: joinError } = await supabase
    .from('join_campaign')
    .select('id, campaign, role, user')
    .match({ token, user: user.id })
    .single()

  if (joinError || !joinCampaign)
    throw createError('Join campaign token not found')

  const { data: member, error: teamError } = await supabase
    .from('team')
    .insert({
      campaign: joinCampaign.campaign,
      role: joinCampaign.role,
      user: joinCampaign.user,
    })
    .select('id, role, user')

  if (teamError) throw createError(teamError)

  const { error: deleteError } = await supabase
    .from('join_campaign')
    .delete()
    .eq('id', joinCampaign.id)

  if (deleteError) throw createError(deleteError)

  return member
})
