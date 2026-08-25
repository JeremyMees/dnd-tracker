import { serverSupabaseServiceRole } from '#supabase/server'
import { getValidatedRouterParams } from 'h3'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)

  await requireEncounterAccess(event, id, user.id)

  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: sheet, error } = await supabase
    .from('initiative_sheets')
    .select('title, round, activeIndex, rows, settings, info, infoCards')
    .eq('id', id)
    .single()

  if (error) throw createError(postgresErrorToH3Error(error))

  await broadcastSheetSync(supabase, id, sheet)

  return { synced: true }
})
