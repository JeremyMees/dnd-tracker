import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database'
import type { JoinCampaignItem } from '~/types/supabase'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole<Database>(event)
  const user = await serverSupabaseUser(event)
  const { token } = await readBody(event)

  if (!token || !user) throw createError('Invalid request')

  // Validate that the join_campaign token exists
  const { data, error } = await supabase
    .from('join_campaign')
    .select(`
      id,
      role,
      user,
      campaign(
        id,
        title
      )
    `)
    .match({ token, user: user.id })
    .single()

  if (error || !data) throw createError('Join campaign token not found')

  return data as unknown as JoinCampaignItem
})
