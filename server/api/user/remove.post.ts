import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole<Database>(event)
  const body: { id: string } = await readBody(event)

  return await supabase.auth.admin.deleteUser(body.id)
})
