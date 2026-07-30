import { serverSupabaseServiceRole } from '#supabase/server'
import * as z from 'zod'

const bodySchema = z.object({
  token: z.string().min(1).max(2048),
})

export default defineEventHandler(async event => {
  const supabase = serverSupabaseServiceRole<DB>(event)
  const user = await requireUser(event)
  const { token } = await readValidatedBody(event, bodySchema.parse)

  const { error } = await supabase
    .from('join_campaign')
    .delete()
    .match({ token, user: user.id })

  if (error) throw createError(error)
})
