import { serverSupabaseServiceRole } from '#supabase/server'
import { getValidatedRouterParams } from 'h3'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)

  await requireEncounterAccess(event, id, user.id)

  const supabase = serverSupabaseServiceRole<DB>(event)

  const { error } = await supabase
    .from('combat_events')
    .delete()
    .eq('encounterId', id)

  if (error) throw createError(postgresErrorToH3Error(error))

  return { deleted: true }
})
