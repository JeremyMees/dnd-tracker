import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole<Database>(event)
  const user = await serverSupabaseUser(event)
  const { token } = await readBody(event)

  if (!token || !user) throw createError('Invalid request')

  // Validate that the join_campaign token exists
  const { data: joinCampaign, error: joinError } = await supabase
    .from('join_campaign')
    .select('id, campaign, role, user')
    .match({ token, user: user.id })
    .single()

  if (joinError || !joinCampaign) throw createError('Join campaign token not found')

  // Insert the new user into the team
  const { data: member, error: teamError } = await supabase
    .from('team')
    .insert({
      campaign: joinCampaign.campaign,
      role: joinCampaign.role,
      user: joinCampaign.user,
    })
    .select('id, role, user')

  if (teamError) throw createError(teamError)

  // Delete the join_campaign token
  const { error: deleteError } = await supabase
    .from('join_campaign')
    .delete()
    .eq('id', joinCampaign.id)

  if (deleteError) throw createError(deleteError)

  return member
})
