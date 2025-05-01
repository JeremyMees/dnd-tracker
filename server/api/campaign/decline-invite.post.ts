import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole<DB>(event)
  const user = await serverSupabaseUser(event)
  const { token } = await readBody(event)

  if (!token || !user) throw createError('Invalid request')

  const { error } = await supabase
    .from('join_campaign')
    .delete()
    .match({ token, user: user.id })

  if (error) throw createError(error)
})
