import { serverSupabaseServiceRole } from '#supabase/server'
import * as z from 'zod'

const bodySchema = z.object({
  id: z.uuid(),
})

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  const { id } = await readValidatedBody(event, bodySchema.parse)

  if (id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const supabase = serverSupabaseServiceRole<DB>(event)

  return await supabase.auth.admin.deleteUser(id)
})
